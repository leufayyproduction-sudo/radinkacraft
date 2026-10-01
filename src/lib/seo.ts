import "server-only";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
type Entity="PRODUCT"|"CATEGORY"|"PAGE"|"BLOG_POST";
export type MetadataEntity={entityType?:Entity;entityId?:string;title:string;description?:string|null;path:string;imageUrl?:string|null;noindex?:boolean};
export type SeoSettings={titleTemplate?:string;separator?:string;siteName?:string;defaultDescription?:string;defaultOgImageUrl?:string;googleVerification?:string;bingVerification?:string;ga4Id?:string;metaPixelId?:string;business?:{name?:string;logoUrl?:string;address?:string;telephone?:string;openingHours?:string;priceRange?:string;socialLinks?:string[]}};
export async function getSeoSettings():Promise<SeoSettings>{const row=await prisma.setting.findUnique({where:{key:"seo"}}).catch(()=>null);return (row?.value&&typeof row.value==="object"?row.value:{}) as SeoSettings;}
export async function buildMetadata(entity:MetadataEntity):Promise<Metadata>{
  const [global,meta]=await Promise.all([getSeoSettings(),entity.entityType&&entity.entityId?prisma.seoMeta.findUnique({where:{entityType_entityId:{entityType:entity.entityType,entityId:entity.entityId}}}).catch(()=>null):Promise.resolve(null)]);
  const siteName=global.siteName||"Radinkacraft";const title=meta?.seoTitle||entity.title;const template=global.titleTemplate||"%%title%% %%sep%% %%sitename%%";const fullTitle=template.replaceAll("%%title%%",title).replaceAll("%%sep%%",global.separator||"|").replaceAll("%%sitename%%",siteName).trim();const description=meta?.metaDescription||entity.description||global.defaultDescription||"Bucket bunga untuk menemani momen istimewa.";
  const origin=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";const fallbackCanonical=new URL(entity.path,origin).toString();const canonical=meta?.canonicalUrl||fallbackCanonical;const image=meta?.ogImageUrl||entity.imageUrl||global.defaultOgImageUrl;
  return {title:fullTitle,description,alternates:{canonical},robots:{index:!entity.noindex&&(meta?.robotsIndex??true),follow:!entity.noindex&&(meta?.robotsFollow??true)},openGraph:{type:entity.entityType==="BLOG_POST"?"article":"website",title:meta?.ogTitle||title,description:meta?.ogDescription||description,url:canonical,siteName,images:image?[{url:image}]:[]},twitter:{card:meta?.twitterCard||"summary_large_image",title:meta?.ogTitle||title,description:meta?.ogDescription||description,images:image?[image]:[]},verification:{...(global.googleVerification?{google:global.googleVerification}:{}),...(global.bingVerification?{other:{"msvalidate.01":global.bingVerification}}:{})}};
}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c");}
export function absoluteUrl(path:string){return new URL(path,process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").toString();}
