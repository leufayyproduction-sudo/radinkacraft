"use server";
import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateProductRating } from "@/lib/product-reviews";

const idSchema=z.string().min(1).max(120);
function refresh(slug:string){revalidatePath("/produk/"+slug);revalidatePath("/toko");revalidatePath("/");}
export async function setProductReviewStatus(id:string,status:ReviewStatus){
 await requireAdmin();const parsed=z.object({id:idSchema,status:z.nativeEnum(ReviewStatus)}).safeParse({id,status});if(!parsed.success)return{error:"Perubahan status tidak valid."};
 const review=await prisma.review.findUnique({where:{id:parsed.data.id},select:{productId:true,product:{select:{slug:true}}}});if(!review)return{error:"Ulasan tidak ditemukan."};
 await prisma.$transaction(async(tx)=>{await tx.review.update({where:{id:parsed.data.id},data:{status:parsed.data.status}});await recalculateProductRating(tx,review.productId);});refresh(review.product.slug);return{ok:true};
}
export async function saveSellerReply(id:string,reply:string){
 await requireAdmin();const parsed=z.object({id:idSchema,reply:z.string().trim().max(1000)}).safeParse({id,reply});if(!parsed.success)return{error:"Balasan maksimal 1.000 karakter."};
 const review=await prisma.review.findUnique({where:{id:parsed.data.id},select:{product:{select:{slug:true}}}});if(!review)return{error:"Ulasan tidak ditemukan."};
 await prisma.review.update({where:{id:parsed.data.id},data:{sellerReply:parsed.data.reply||null,sellerReplyAt:parsed.data.reply?new Date():null}});refresh(review.product.slug);return{ok:true};
}
export async function deleteProductReview(id:string){
 await requireAdmin();const parsed=idSchema.safeParse(id);if(!parsed.success)return{error:"Ulasan tidak valid."};
 const review=await prisma.review.findUnique({where:{id:parsed.data},include:{photos:true,product:{select:{id:true,slug:true}}}});if(!review)return{error:"Ulasan tidak ditemukan."};
 if(review.photos.length){const {error}=await createAdminClient().storage.from("reviews").remove(review.photos.map((photo)=>photo.path));if(error)return{error:"Foto ulasan belum dapat dihapus dari Storage."};}
 await prisma.$transaction(async(tx)=>{await tx.review.delete({where:{id:review.id}});await recalculateProductRating(tx,review.product.id);});refresh(review.product.slug);return{ok:true};
}
