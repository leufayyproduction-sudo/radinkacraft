import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { SeoEntityType, TwitterCardType } from "@prisma/client";
const metaSchema=z.object({focusKeyword:z.string().trim().max(100),seoTitle:z.string().trim().max(70),metaDescription:z.string().trim().max(170),canonicalUrl:z.string().trim().max(2000),robotsIndex:z.boolean(),robotsFollow:z.boolean(),ogTitle:z.string().trim().max(120),ogDescription:z.string().trim().max(300),ogImageUrl:z.string().trim().max(2000),twitterCard:z.nativeEnum(TwitterCardType),breadcrumbTitle:z.string().trim().max(150)});
export async function persistSeoMeta(formData:FormData,entityType:SeoEntityType,entityId:string,previousEntityId?:string){
 await requireAdmin();let raw:unknown;try{raw=JSON.parse(String(formData.get("seoMeta")||"{}"));}catch{return false;}const parsed=metaSchema.safeParse(raw);if(!parsed.success)return false;
 const keyword=parsed.data.focusKeyword;const existing=keyword?await prisma.seoMeta.findFirst({where:{focusKeyword:{equals:keyword,mode:"insensitive"},NOT:{entityType,entityId}}}):null;
 if(previousEntityId&&previousEntityId!==entityId){const old=await prisma.seoMeta.findUnique({where:{entityType_entityId:{entityType,entityId:previousEntityId}}});if(old)await prisma.seoMeta.delete({where:{id:old.id}});}
 await prisma.seoMeta.upsert({where:{entityType_entityId:{entityType,entityId}},create:{...parsed.data,entityType,entityId,canonicalUrl:parsed.data.canonicalUrl||null,ogTitle:parsed.data.ogTitle||null,ogDescription:parsed.data.ogDescription||null,ogImageUrl:parsed.data.ogImageUrl||null,seoTitle:parsed.data.seoTitle||null,metaDescription:parsed.data.metaDescription||null,focusKeyword:keyword||null,breadcrumbTitle:parsed.data.breadcrumbTitle||null},update:{...parsed.data,canonicalUrl:parsed.data.canonicalUrl||null,ogTitle:parsed.data.ogTitle||null,ogDescription:parsed.data.ogDescription||null,ogImageUrl:parsed.data.ogImageUrl||null,seoTitle:parsed.data.seoTitle||null,metaDescription:parsed.data.metaDescription||null,focusKeyword:keyword||null,breadcrumbTitle:parsed.data.breadcrumbTitle||null}});
 return Boolean(existing);
}

const pathSchema=z.string().regex(/^\/(?!\/)[^?#\s]*$/).max(500);
export async function persistSlugRedirect(from:string,to:string,statusCode:301|302=301){
 await requireAdmin();const source=pathSchema.safeParse(from);const target=pathSchema.safeParse(to);if(!source.success||!target.success||source.data===target.data)throw new Error("Jalur redirect tidak valid.");
 let cursor=target.data;const seen=new Set<string>([source.data]);for(let i=0;i<20;i++){if(seen.has(cursor))throw new Error("Redirect akan membentuk siklus.");seen.add(cursor);const next=await prisma.redirect.findFirst({where:{fromPath:cursor,isActive:true},select:{toPath:true}});if(!next)break;cursor=next.toPath;}
 await prisma.$transaction(async tx=>{await tx.redirect.updateMany({where:{toPath:source.data,isActive:true},data:{toPath:target.data}});await tx.redirect.upsert({where:{fromPath:source.data},create:{fromPath:source.data,toPath:target.data,statusCode,isActive:true},update:{toPath:target.data,statusCode,isActive:true}});});
}
