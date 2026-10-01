import "server-only";
import { permanentRedirect,redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
export async function redirectOrLogNotFound(path:string,referrer?:string|null):Promise<void>{
 const normalized=path.startsWith("/")&&!path.startsWith("//")?path:"/";
 let safeReferrer:string|null=null;try{safeReferrer=referrer?new URL(referrer).pathname.slice(0,500):null;}catch{safeReferrer=null;}
 const row=await prisma.redirect.findFirst({where:{fromPath:normalized,isActive:true}}).catch(()=>null);
 if(row){await prisma.redirect.update({where:{id:row.id},data:{hits:{increment:1}}}).catch(()=>undefined);if(row.statusCode===301)permanentRedirect(row.toPath);redirect(row.toPath);}
 await prisma.notFoundLog.upsert({where:{path:normalized},create:{path:normalized,count:1,lastSeenAt:new Date(),lastReferrer:safeReferrer},update:{count:{increment:1},lastSeenAt:new Date(),lastReferrer:safeReferrer}}).catch(()=>undefined);
}
