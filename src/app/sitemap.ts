import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [products,categories,pages,posts,excluded]=await Promise.all([prisma.product.findMany({where:{status:"PUBLISHED"},select:{slug:true,updatedAt:true}}),prisma.category.findMany({where:{isActive:true},select:{slug:true,createdAt:true}}),prisma.page.findMany({where:{status:"PUBLISHED"},select:{slug:true,updatedAt:true}}),prisma.blogPost.findMany({where:{status:"PUBLISHED",publishedAt:{lte:new Date()}},select:{slug:true,updatedAt:true,publishedAt:true}}),prisma.seoMeta.findMany({where:{robotsIndex:false},select:{entityType:true,entityId:true}})]).catch(()=>[[],[],[],[],[]] as const);
  const blocked=new Set(excluded.map(row=>`${row.entityType}:${row.entityId}`));const entries:MetadataRoute.Sitemap=[{url:absoluteUrl("/"),lastModified:new Date()},{url:absoluteUrl("/toko"),lastModified:new Date()},{url:absoluteUrl("/ulasan"),lastModified:new Date()}];
  entries.push(...products.filter(row=>!blocked.has(`PRODUCT:${row.slug}`)).map(row=>({url:absoluteUrl(`/produk/${row.slug}`),lastModified:row.updatedAt})),...categories.filter(row=>!blocked.has(`CATEGORY:${row.slug}`)).map(row=>({url:absoluteUrl(`/kategori/${row.slug}`),lastModified:row.createdAt})),...pages.filter(row=>!blocked.has(`PAGE:${row.slug}`)&&row.slug!=="beranda").map(row=>({url:absoluteUrl(`/${row.slug}`),lastModified:row.updatedAt})),...posts.filter(row=>!blocked.has(`BLOG_POST:${row.slug}`)).map(row=>({url:absoluteUrl(`/blog/${row.slug}`),lastModified:row.updatedAt||row.publishedAt||new Date()})));
  return entries;
}
