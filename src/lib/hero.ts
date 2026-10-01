import "server-only";
import { prisma } from "@/lib/prisma";

export async function getHeroSlides() {
  const records = await prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { product: { include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, images: { where: { isPrimary: true }, take: 1 } } } } });
  return records.map((slide) => ({
    id: slide.id, title: slide.title, description: slide.description, image: slide.imageUrl,
    imageAlt: slide.imageAlt || slide.title, blendMultiply: slide.blendMultiply,
    productSlug: slide.product?.slug ?? null,
    variants: slide.product?.variants.map((variant) => ({ name: variant.name, price: variant.price })) ?? [],
    defaultSize: slide.product?.variants.some((variant) => variant.name === "M") ? "M" : slide.product?.variants[0]?.name ?? "M",
    fallbackPrice: slide.product?.variants[0]?.price ?? 0,
  }));
}
