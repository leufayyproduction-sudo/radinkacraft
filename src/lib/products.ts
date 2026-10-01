import "server-only";
import { ProductStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export { formatRupiah } from "@/lib/money";

const productInclude = {
  category: true,
  images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }> & {
  minPrice: number;
  compareAtPrice: number | null;
  totalStock: number;
  primaryImage: Prisma.ProductGetPayload<{ include: typeof productInclude }>['images'][number] | null;
};

function withPrice(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>): CatalogProduct {
  const variants = product.variants;
  const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
  const compareAtPrice = cheapest?.compareAtPrice && cheapest.compareAtPrice > cheapest.price ? cheapest.compareAtPrice : null;
  return {
    ...product,
    minPrice: cheapest?.price ?? 0,
    compareAtPrice,
    totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    primaryImage: product.images[0] ?? null,
  };
}

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({ where: { status: ProductStatus.PUBLISHED, isFeatured: true, variants: { some: { isActive: true } } }, include: productInclude, take: limit, orderBy: { createdAt: "desc" } });
  return products.map(withPrice);
}

export async function getCategories() {
  return prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export type ProductListFilters = {
  kategori?: string;
  q?: string;
  min?: string | number;
  max?: string | number;
  ukuran?: string;
  urut?: string;
  page?: string | number;
  pageSize?: number;
};

export async function listProducts(filters: ProductListFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const min = Number(filters.min) || undefined;
  const max = Number(filters.max) || undefined;
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
    ...(filters.kategori ? { category: { slug: filters.kategori } } : {}),
    ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { shortDescription: { contains: filters.q, mode: "insensitive" } }] } : {}),
    variants: { some: { isActive: true, ...(filters.ukuran ? { name: filters.ukuran } : {}), ...(min || max ? { price: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } } : {}) } },
  };
  const rows = (await prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: "desc" } })).map(withPrice);
  if (filters.urut === "harga-rendah") rows.sort((a, b) => a.minPrice - b.minPrice);
  if (filters.urut === "harga-tinggi") rows.sort((a, b) => b.minPrice - a.minPrice);
  const total = rows.length;
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, status: ProductStatus.PUBLISHED, variants: { some: { isActive: true } } }, include: productInclude });
  return product ? withPrice(product) : null;
}

export async function getRelatedProducts(product: Pick<CatalogProduct, "id" | "categoryId">, limit = 4) {
  const products = await prisma.product.findMany({ where: { status: ProductStatus.PUBLISHED, categoryId: product.categoryId, id: { not: product.id }, variants: { some: { isActive: true } } }, include: productInclude, take: limit, orderBy: { createdAt: "desc" } });
  return products.map(withPrice);
}
