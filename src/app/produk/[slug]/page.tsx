import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "Produk tidak ditemukan | radinkacraft" };
  const image = product.primaryImage?.url;
  return {
    title: `${product.name} | radinkacraft`,
    description: product.shortDescription,
    openGraph: { title: `${product.name} | radinkacraft`, description: product.shortDescription, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();
  const related = await getRelatedProducts(product).catch(() => []);
  return <main className="product-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/toko">Toko</Link><span>/</span><span>{product.name}</span></nav>
    <ProductDetail product={product} />
    {related.length > 0 && <section className="floating-panel related-products"><div className="section-heading"><p className="eyebrow">Pilihan lainnya</p><h2>Rangkaian serupa</h2></div><div className="shop-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
  </main>;
}
