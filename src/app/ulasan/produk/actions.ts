"use server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus, ReviewStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateProductRating } from "@/lib/product-reviews";
import { prohibitedWords } from "@/lib/profanity";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeTokenEqual } from "@/lib/token";

const itemIdSchema = z.string().min(1).max(120);
const contentIsFlagged = (body: string) => /(?:https?:\/\/|www\.)|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|(?:\+?62|0)8[0-9\s().-]{7,}/i.test(body) || prohibitedWords.some((word) => new RegExp("\\b" + word + "\\b", "i").test(body));

async function authorizedItem(orderItemId: string, token?: string) {
  const id = itemIdSchema.safeParse(orderItemId); if (!id.success) return null;
  const profile = await getCurrentProfile().catch(() => null);
  const item = await prisma.orderItem.findUnique({ where: { id: id.data }, include: { order: true, product: { select: { slug: true } }, review: { include: { photos: true } } } });
  if (!item || item.order.status !== OrderStatus.SELESAI) return null;
  if (item.order.userId !== profile?.id && !safeTokenEqual(item.order.accessToken, token)) return null;
  return { item, profile };
}

export async function createReviewPhotoUploadUrl(orderItemId: string, token: string | undefined, file: { name: string; type: string; size: number }) {
  const limit = await checkRateLimit("review-photo-upload", 15, 60 * 60 * 1000);
  if (!limit.allowed) throw new Error(limit.message);
  if (!await authorizedItem(orderItemId, token)) throw new Error("Unggahan hanya tersedia untuk item pesanan selesai milikmu.");
  const valid = z.object({ type: z.enum(["image/jpeg", "image/png", "image/webp"]), size: z.number().int().min(1).max(5 * 1024 * 1024), name: z.string().max(200) }).safeParse(file);
  if (!valid.success) throw new Error("Foto harus JPG, PNG, atau WebP maksimal 5 MB.");
  const path = "product-reviews/" + orderItemId + "/" + randomUUID() + ".webp";
  const { data, error } = await createAdminClient().storage.from("reviews").createSignedUploadUrl(path);
  if (error || !data) throw new Error("Tautan unggah foto belum tersedia.");
  return { path, token: data.token };
}

export async function saveProductReview(formData: FormData) {
  const limit = await checkRateLimit("product-review", 5, 60 * 60 * 1000);
  if (!limit.allowed) return { error: limit.message };
  const token = String(formData.get("token") || "") || undefined; let photos: unknown;
  try { photos = JSON.parse(String(formData.get("photos") || "[]")); } catch { return { error: "Daftar foto tidak terbaca." }; }
  const parsed = z.object({ orderItemId: itemIdSchema, reviewId: z.string().optional(), token: z.string().optional(), displayName: z.string().trim().min(2).max(60), showFullName: z.boolean(), rating: z.coerce.number().int().min(1).max(5), body: z.string().trim().min(10).max(1000), photos: z.array(z.string().regex(/^product-reviews\/[\w-]+\/[\w-]+\.webp$/)).max(5) }).safeParse({ orderItemId: formData.get("orderItemId"), reviewId: formData.get("reviewId") || undefined, token, displayName: formData.get("displayName"), showFullName: formData.get("showFullName") === "on", rating: formData.get("rating"), body: formData.get("body"), photos });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Periksa kembali isi ulasan." };
  const authorized = await authorizedItem(parsed.data.orderItemId, parsed.data.token);
  if (!authorized) return { error: "Ulasan hanya dapat dibuat untuk pesanan selesai milikmu." };
  const { item, profile } = authorized; const existing = item.review;
  if (parsed.data.reviewId && existing?.id !== parsed.data.reviewId) return { error: "Ulasan tidak ditemukan." };
  if (existing && Date.now() - existing.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000) return { error: "Masa ubah ulasan selama 7 hari sudah berakhir." };
  const paths = [...new Set(parsed.data.photos)];
  if (paths.some((path) => !path.startsWith("product-reviews/" + item.id + "/"))) return { error: "Foto ulasan tidak sesuai dengan item pesanan." };
  const { data: stored, error: listError } = await createAdminClient().storage.from("reviews").list("product-reviews/" + item.id);
  if (listError || paths.some((path) => !stored?.some((file) => file.name === path.split("/").at(-1)))) return { error: "Selesaikan unggah foto sebelum menyimpan ulasan." };
  const status = contentIsFlagged(parsed.data.body) ? ReviewStatus.PENDING : ReviewStatus.PUBLISHED;
  const oldPaths = existing?.photos.map((photo) => photo.path).filter((path) => !paths.includes(path)) ?? [];
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.orderItem.findUniqueOrThrow({ where: { id: item.id }, include: { order: true, review: true } });
      if (current.order.status !== OrderStatus.SELESAI) throw new Error("Pesanan belum berstatus selesai.");
      let reviewId = existing?.id;
      if (existing) {
        await tx.review.update({ where: { id: existing.id }, data: { displayName: parsed.data.displayName, showFullName: parsed.data.showFullName, rating: parsed.data.rating, body: parsed.data.body, status, sellerReply: null, sellerReplyAt: null } });
        await tx.reviewPhoto.deleteMany({ where: { reviewId: existing.id } });
      } else {
        if (current.review) throw new Error("Item pesanan ini sudah memiliki ulasan.");
        const created = await tx.review.create({ data: { productId: current.productId!, orderItemId: item.id, userId: profile?.id ?? null, displayName: parsed.data.displayName, showFullName: parsed.data.showFullName, rating: parsed.data.rating, body: parsed.data.body, status } });
        reviewId = created.id;
      }
      if (paths.length) await tx.reviewPhoto.createMany({ data: paths.map((path, sortOrder) => ({ reviewId: reviewId!, path, url: createAdminClient().storage.from("reviews").getPublicUrl(path).data.publicUrl, sortOrder })) });
      await recalculateProductRating(tx, current.productId!);
    });
  } catch (error) { return { error: error instanceof Error ? error.message : "Ulasan belum dapat disimpan." }; }
  if (oldPaths.length) await createAdminClient().storage.from("reviews").remove(oldPaths).catch(() => undefined);
  revalidatePath("/produk/" + (item.product?.slug ?? "")); revalidatePath("/toko"); revalidatePath("/");
  return { ok: true, message: status === ReviewStatus.PENDING ? "Ulasan tersimpan dan menunggu pemeriksaan." : "Terima kasih! Ulasanmu sudah diterbitkan." };
}

export async function toggleReviewHelpful(reviewId: string) {
  const id = itemIdSchema.safeParse(reviewId); if (!id.success) return { error: "Ulasan tidak valid." };
  const review = await prisma.review.findFirst({ where: { id: id.data, status: ReviewStatus.PUBLISHED }, select: { id: true, product: { select: { slug: true } } } });
  if (!review) return { error: "Ulasan tidak ditemukan." };
  const profile = await getCurrentProfile().catch(() => null); const jar = cookies(); let anon = jar.get("review-voter")?.value;
  if (!profile && !anon) { anon = randomBytes(32).toString("hex"); jar.set("review-voter", anon, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000 }); }
  const voterKey = profile ? "user:" + profile.id : "anon:" + createHash("sha256").update(anon!).digest("hex");
  let result: { voted: boolean; count: number };
  try {
    result = await prisma.$transaction(async (tx) => {
      const key = { reviewId_voterKey: { reviewId: review.id, voterKey } }; const prior = await tx.reviewHelpful.findUnique({ where: key });
      if (prior) await tx.reviewHelpful.delete({ where: key }); else await tx.reviewHelpful.create({ data: { reviewId: review.id, voterKey } });
      const count = await tx.reviewHelpful.count({ where: { reviewId: review.id } }); await tx.review.update({ where: { id: review.id }, data: { helpfulCount: count } });
      return { voted: !prior, count };
    });
  } catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) return { error: "Suara belum dapat disimpan." }; result = { voted: true, count: (await prisma.review.findUnique({ where: { id: review.id }, select: { helpfulCount: true } }))?.helpfulCount ?? 0 }; }
  revalidatePath("/produk/" + review.product.slug); return result;
}
