import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductDetail } from "@/components/product-detail";
import { SiteHeader } from "@/components/site-header";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getProductReviewPage } from "@/lib/product-reviews";
import { ProductReviewSection } from "@/components/product-review-section";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirectOrLogNotFound } from "@/lib/redirect-handler";

type PageProps = { params: { slug: string }; searchParams?: { rating?: string; foto?: string; urut?: string; reviewPage?: string } };

export const revalidate=60;
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "Produk tidak ditemukan | radinkacraft", robots:{index:false,follow:false} };
  return buildMetadata({entityType:"PRODUCT",entityId:product.slug,title:product.name,description:product.shortDescription,path:`/produk/${product.slug}`,imageUrl:product.primaryImage?.url});
}

export default async function ProductPage({ params, searchParams = {} }: PageProps) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) { await redirectOrLogNotFound(`/produk/${params.slug}`,headers().get("referer")); notFound(); }
  const related = await getRelatedProducts(product).catch(() => []);
  const rating = Number(searchParams.rating); const page = Number(searchParams.reviewPage);
  const reviewData = await getProductReviewPage(product.id, { rating: rating >= 1 && rating <= 5 ? rating : undefined, photos: searchParams.foto === "1", sort: searchParams.urut === "membantu" ? "helpful" : "newest", page: Number.isInteger(page) && page > 0 ? page : 1 }).catch(() => ({ average: product.ratingAvg, ratingCount: product.ratingCount, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [], total: 0, page: 1, pageCount: 1 }));
  const reviews=product.ratingCount?await prisma.review.findMany({where:{productId:product.id,status:"PUBLISHED"},orderBy:{createdAt:"desc"},take:10,include:{orderItem:{select:{variantName:true}}}}):[];
  const itemList=[{"@type":"ListItem",position:1,name:"Beranda",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"Toko",item:absoluteUrl("/toko")},{"@type":"ListItem",position:3,name:product.category.name,item:absoluteUrl(`/kategori/${product.category.slug}`)},{"@type":"ListItem",position:4,name:product.name,item:absoluteUrl(`/produk/${product.slug}`)}];
  const productJson={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,image:product.images.map(image=>image.url),sku:product.variants[0]?.sku||undefined,brand:{"@type":"Brand",name:"Radinkacraft"},offers:{"@type":"Offer",price:product.minPrice,priceCurrency:"IDR",availability:product.totalStock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",url:absoluteUrl(`/produk/${product.slug}`)},...(product.ratingCount?{aggregateRating:{"@type":"AggregateRating",ratingValue:product.ratingAvg,reviewCount:product.ratingCount},review:reviews.map(review=>({"@type":"Review",reviewRating:{"@type":"Rating",ratingValue:review.rating,bestRating:5},author:{"@type":"Person",name:review.displayName},datePublished:review.createdAt.toISOString(),reviewBody:review.body,name:review.orderItem.variantName}))}:{})};
  return <main className="product-page"><SiteHeader /><JsonLd data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:itemList}}/><JsonLd data={productJson}/>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/toko">Toko</Link><span>/</span><Link href={`/kategori/${product.category.slug}`}>{product.category.name}</Link><span>/</span><span>{product.name}</span></nav>
    <ProductDetail product={product} />
    <ProductReviewSection data={reviewData} slug={product.slug} />
    {related.length > 0 && <section className="floating-panel related-products"><div className="section-heading"><p className="eyebrow">Pilihan lainnya</p><h2>Rangkaian serupa</h2></div><div className="shop-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
  </main>;
}
