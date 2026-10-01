"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus, TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { prohibitedWords } from "@/lib/profanity";
import { checkRateLimit } from "@/lib/rate-limit";

export type TestimonialFormState = { message?: string; pendingReview?: boolean; resetKey?: number };
const schema = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(60, "Nama maksimal 60 karakter."), rating: z.coerce.number().int().min(1).max(5), message: z.string().trim().min(10, "Ulasan minimal 10 karakter.").max(300, "Ulasan maksimal 300 karakter."), website: z.string().max(0).optional(), startedAt: z.coerce.number().int().positive() });
const hasContactData = (text: string) => /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?62|0)\s*8[\d\s-]{7,14}/i.test(text);

export async function submitTestimonial(previous: TestimonialFormState, formData: FormData): Promise<TestimonialFormState> {
  if (String(formData.get("website") || "").trim()) return { message: "Terima kasih sudah berbagi cerita." };
  const parsed = schema.safeParse({ name: formData.get("name"), rating: formData.get("rating"), message: formData.get("message"), website: formData.get("website"), startedAt: formData.get("startedAt") });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message || "Periksa kembali ulasanmu." };
  if (Date.now() - parsed.data.startedAt < 3000) return { message: "Mohon luangkan waktu sejenak sebelum mengirim ulasan." };
  const profile = await getCurrentProfile();
  const forwarded = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || headers().get("x-real-ip") || "unknown";
  const salt = process.env.TESTIMONIAL_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ipHash = createHash("sha256").update(`${forwarded}${salt}`).digest("hex");
  const rateLimit = await checkRateLimit("testimonial", 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) return { message: rateLimit.message };
  const isVerifiedBuyer = profile ? Boolean(await prisma.order.findFirst({ where: { userId: profile.id, status: { in: [OrderStatus.DIBAYAR, OrderStatus.DIPROSES, OrderStatus.DIKIRIM, OrderStatus.SELESAI] } }, select: { id: true } })) : false;
  const cleanMessage = parsed.data.message;
  const flagged = hasContactData(cleanMessage) || prohibitedWords.some((word) => new RegExp(`\\b${word}\\b`, "i").test(cleanMessage));
  const status = flagged ? TestimonialStatus.PENDING : TestimonialStatus.PUBLISHED;
  await prisma.testimonial.create({ data: { name: parsed.data.name, message: cleanMessage, rating: parsed.data.rating, status, isVerifiedBuyer, isSample: false, userId: profile?.id ?? null, ipHash } });
  revalidatePath("/"); revalidatePath("/ulasan");
  return { message: flagged ? "Ulasanmu menunggu persetujuan sebelum ditampilkan." : "Terima kasih! Ulasanmu sudah diterbitkan.", pendingReview: flagged, resetKey: Date.now() };
}
