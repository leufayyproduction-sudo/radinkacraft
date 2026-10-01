import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";
import { redirectOrLogNotFound } from "@/lib/redirect-handler";
import { headers } from "next/headers";
type Props={params:{slug:string};searchParams:{page?:string}};
async function getCategory(slug:string){return prisma.category.findFirst({where:{slug,isActive:true}});}
export const revalidate=60;
export async function generateMetadata({params}:Props):Promise<Metadata>{const category=await getCategory(params.slug);return category?buildMetadata({entityType:"CATEGORY",entityId:category.slug,title:category.name,description:category.description,path:`/kategori/${category.slug}`,imageUrl:category.imageUrl}):{title:"Kategori tidak ditemukan | radinkacraft",robots:{index:false,follow:false}};}
export default async function CategoryPage({params,searchParams}:Props){const category=await getCategory(params.slug);if(!category){await redirectOrLogNotFound(`/kategori/${params.slug}`,headers().get("referer"));notFound();}const result=await listProducts({kategori:category.slug,page:searchParams.page,pageSize:12});const url=absoluteUrl(`/kategori/${category.slug}`);const crumbs={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{ "@type":"ListItem",position:1,name:"Beranda",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:category.name,item:url}]};return <main className="shop-page"><SiteHeader/><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span>/</span><span>{category.name}</span></nav><JsonLd data={crumbs}/><header className="floating-panel shop-hero"><p className="eyebrow">Kategori bunga</p><h1>{category.name}</h1><p>{category.description}</p></header><section className="shop-results"><div className="shop-grid">{result.items.map(product=><ProductCard key={product.id} product={product}/>)}</div>{!result.items.length&&<p className="floating-panel cms-panel">Belum ada rangkaian di kategori ini.</p>}{result.pageCount>1&&<nav className="pagination" aria-label="Paginasi kategori">{result.page>1&&<Link href={`?page=${result.page-1}`}>Sebelumnya</Link>}<span>Halaman {result.page} dari {result.pageCount}</span>{result.page<result.pageCount&&<Link href={`?page=${result.page+1}`}>Berikutnya</Link>}</nav>}</section></main>}
