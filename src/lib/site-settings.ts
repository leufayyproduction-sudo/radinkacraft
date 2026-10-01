import "server-only";
import { prisma } from "@/lib/prisma";
import { homepageContent } from "@/data/homepage";
export type NavItem={label:string;href:string};
export type SiteData={name:string;logoUrl:string;faviconUrl:string};
export type FooterData={note:string;copyright:string;address:string;phone:string;email:string;columns:{title:string;links:NavItem[]}[];socials:NavItem[]};
function value<T>(input:unknown,fallback:T):T { return input&&typeof input==="object"?{...fallback,...input} as T:fallback; }
export async function getSiteSettings(){
  const rows=await prisma.setting.findMany({where:{key:{in:["site","nav","footer","store"]}}}).catch(()=>[]);
  const get=(key:string)=>rows.find((row)=>row.key===key)?.value;
  const site=value<SiteData>(get("site"),{name:"radinkacraft",logoUrl:"",faviconUrl:""});
  const navRaw=get("nav");const nav=(Array.isArray(navRaw)?navRaw as NavItem[]:homepageContent.navigation).filter((item)=>item&&typeof item.label==="string"&&typeof item.href==="string"&&safeSiteLink(item.href));
  if(!nav.some((item)=>item.href==="/blog"))nav.push({label:"Blog",href:"/blog"});
  const footer=value<FooterData>(get("footer"),{note:homepageContent.footer.note,copyright:homepageContent.footer.copyright,address:"",phone:"",email:homepageContent.contactEmail,columns:[],socials:[]});
  const store=value<{whatsapp:string}>(get("store"),{whatsapp:""});
  return {site,nav,footer,store};
}
export function safeSiteLink(href:string){return (href.startsWith("/")&&!href.startsWith("//"))||/^(https:\/\/|mailto:|tel:)/i.test(href);}
