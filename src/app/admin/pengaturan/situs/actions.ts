"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
const item=z.object({label:z.string().trim().min(1).max(60),href:z.string().trim().min(1).max(1000).refine((value)=>(value.startsWith("/")&&!value.startsWith("//"))||/^(https:\/\/|mailto:|tel:)/i.test(value))});
const schema=z.object({site:z.object({name:z.string().trim().min(1).max(80),logoUrl:z.string().max(1000),faviconUrl:z.string().max(1000)}),nav:z.array(item).max(20),footer:z.object({note:z.string().max(500),copyright:z.string().max(200),address:z.string().max(500),phone:z.string().max(60),email:z.string().email().or(z.literal("")),columns:z.array(z.object({title:z.string().max(80),links:z.array(item).max(20)})).max(8),socials:z.array(item).max(20)})});
export async function saveSiteSettings(formData:FormData){await requireAdmin();let input:unknown;try{input=JSON.parse(String(formData.get("settings")||"{}"));}catch{redirect("/admin/pengaturan/situs?error=Data%20tidak%20valid");}const parsed=schema.safeParse(input);if(!parsed.success)redirect("/admin/pengaturan/situs?error=Periksa%20tautan%20dan%20informasi");await Promise.all(Object.entries(parsed.data).map(([key,value])=>prisma.setting.upsert({where:{key},create:{key,value:value as any},update:{value:value as any}})));revalidatePath("/","layout");redirect("/admin/pengaturan/situs?success=Pengaturan%20situs%20tersimpan");}
