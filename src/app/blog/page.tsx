import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
export const revalidate=60;
export async function generateMetadata():Promise<Metadata>{return buildMetadata({title:"Blog radinkacraft",description:"Cerita, inspirasi, dan pilihan bunga dari radinkacraft.",path:"/blog"});}
export default async function BlogIndex({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1); const pageSize = 9;
  const [posts,total]=await Promise.all([prisma.blogPost.findMany({where:{status:"PUBLISHED",publishedAt:{lte:new Date()}},orderBy:{publishedAt:"desc"},skip:(page-1)*pageSize,take:pageSize}),prisma.blogPost.count({where:{status:"PUBLISHED",publishedAt:{lte:new Date()}}})]);
  const pages=Math.max(1,Math.ceil(total/pageSize));
  return <main className="page-content cms-public"><SiteHeader/><header className="floating-panel cms-title"><p className="eyebrow">Cerita dan inspirasi</p><h1>Blog radinkacraft</h1></header><section className="cms-blog-grid">{posts.map(post=><article className="floating-panel cms-blog-card" key={post.id}>{post.coverImageUrl&&<Link href={`/blog/${post.slug}`}><Image src={post.coverImageUrl} alt={post.coverAlt||post.title} width={720} height={460}/></Link>}<p className="eyebrow">{post.publishedAt&&new Intl.DateTimeFormat("id-ID",{dateStyle:"long"}).format(post.publishedAt)}</p><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="secondary-button" href={`/blog/${post.slug}`}>Baca artikel</Link></article>)}</section>{!posts.length&&<section className="floating-panel cms-panel">Belum ada artikel yang diterbitkan.</section>}<nav className="cms-pagination" aria-label="Paginasi blog">{page>1&&<Link href={`/blog?page=${page-1}`}>Sebelumnya</Link>}<span>Halaman {page} dari {pages}</span>{page<pages&&<Link href={`/blog?page=${page+1}`}>Berikutnya</Link>}</nav></main>;
}
