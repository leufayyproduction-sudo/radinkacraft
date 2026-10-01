"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PaymentMethod, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailTemplate, sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeTokenEqual } from "@/lib/token";

const checkoutSchema = z.object({ customerName: z.string().trim().min(2), customerEmail: z.string().email(), customerPhone: z.string().regex(/^(\+?62|0)8[0-9\s-]{7,13}$/, "Nomor telepon Indonesia tidak valid."), recipientName: z.string().trim().min(2), recipientPhone: z.string().regex(/^(\+?62|0)8[0-9\s-]{7,13}$/, "Nomor telepon penerima tidak valid."), address: z.string().trim().min(8), city: z.string().trim().min(2), postalCode: z.string().optional(), shippingZone: z.string().min(1), deliveryDate: z.coerce.date(), deliverySlot: z.enum(["PAGI", "SIANG", "SORE"]), cardMessage: z.string().max(200).optional(), notes: z.string().max(1000).optional(), paymentMethod: z.nativeEnum(PaymentMethod), cart: z.array(z.object({ variantId: z.string(), qty: z.number().int().min(1), note: z.string().max(200).optional() })).min(1).max(30) });
const proofTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

export type CheckoutState = { error?: string; upload?: { orderNumber: string; token: string; path: string; uploadToken: string; type: string } };

export async function createOrderAction(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const limit = await checkRateLimit("create-order", 5, 60 * 60 * 1000);
  if (!limit.allowed) return { error: limit.message };
  let cart: unknown;
  try { cart = JSON.parse(String(formData.get("cart") || "[]")); } catch { return { error: "Keranjang tidak terbaca. Muat ulang halaman dan coba kembali." }; }
  const parsed = checkoutSchema.safeParse({ ...Object.fromEntries(formData), cart });
  if (!parsed.success) return { error: parsed.error.issues[0].message || "Periksa kembali data pengiriman." };
  const hasProof = formData.get("hasProof") === "true";
  const proofMeta = hasProof ? z.object({ name: z.string().max(200), type: z.string(), size: z.coerce.number().int().positive() }).safeParse({ name: formData.get("proofName"), type: formData.get("proofType"), size: formData.get("proofSize") }) : null;
  if (hasProof && (!proofMeta?.success || proofMeta.data.size > 5 * 1024 * 1024 || !proofTypes[proofMeta.data.name.split(".").pop()?.toLowerCase() ?? ""] || proofTypes[proofMeta.data.name.split(".").pop()?.toLowerCase() ?? ""] !== proofMeta.data.type)) {
    const uploadLimit = await checkRateLimit("proof-upload", 5, 60 * 60 * 1000);
    if (!uploadLimit.allowed) return { error: uploadLimit.message };
    return { error: "Bukti bayar harus JPG, PNG, WebP, atau PDF maksimal 5 MB." };
  }
  if (hasProof) { const uploadLimit = await checkRateLimit("proof-upload", 5, 60 * 60 * 1000); if (!uploadLimit.allowed) return { error: uploadLimit.message }; }
  const profile = await getCurrentProfile();
  const { cart: cartItems, deliveryDate, ...fields } = parsed.data;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today); lastDay.setDate(today.getDate() + 60);
  if (deliveryDate < today || deliveryDate > lastDay) return { error: "Tanggal pengiriman harus dalam 60 hari ke depan." };
  const shippingSetting = await prisma.setting.findUnique({ where: { key: "shipping" } });
  const zones = Array.isArray(shippingSetting?.value) ? shippingSetting.value as Array<{ name: string; fee: number }> : [];
  const zone = zones.find((item) => item.name === fields.shippingZone);
  if (!zone) return { error: "Pilih zona pengiriman yang tersedia." };
  const expirySetting = await prisma.setting.findUnique({ where: { key: "paymentExpiryHours" } });
  const expiryHours = typeof expirySetting?.value === "number" ? expirySetting.value : 24;
  const bank = fields.paymentMethod === PaymentMethod.BANK ? await prisma.bankAccount.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }) : null;
  if (fields.paymentMethod === PaymentMethod.BANK && !bank) return { error: "Rekening transfer belum tersedia. Silakan pilih QRIS atau hubungi Radinkacraft." };
  const rows = await prisma.productVariant.findMany({ where: { id: { in: cartItems.map((item) => item.variantId) }, isActive: true, product: { status: "PUBLISHED" } }, include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } } } } });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const requestedCounts = new Map<string, number>();
  for (const item of cartItems) requestedCounts.set(item.variantId, (requestedCounts.get(item.variantId) ?? 0) + item.qty);
  const entries = [...requestedCounts.entries()];
  if (entries.some(([id]) => !byId.has(id))) return { error: "Salah satu produk sudah tidak tersedia. Perbarui keranjangmu." };
  const subtotal = entries.reduce((sum, [id, qty]) => sum + byId.get(id)!.price * qty, 0);
  const total = subtotal + zone.fee;
  const qris = fields.paymentMethod === PaymentMethod.QRIS ? await prisma.qrisAsset.findFirst({ where: { amount: total, isActive: true } }) : null;
  const initialStatus = fields.paymentMethod === PaymentMethod.QRIS && !qris ? OrderStatus.MENUNGGU_QRIS : OrderStatus.MENUNGGU_BAYAR;
  let order: { id: string; orderNumber: string; accessToken: string } | null = null;
  for (let attempt = 0; attempt < 4 && !order; attempt++) {
    const date = new Date();
    const dateCode = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("-", "");
    try {
      order = await prisma.$transaction(async (tx) => {
        const counts = await tx.order.count({ where: { orderNumber: { startsWith: `RC-${dateCode}-` } } });
        const orderNumber = `RC-${dateCode}-${String(counts + 1 + attempt).padStart(4, "0")}`;
        for (const [id, qty] of entries) {
          const updated = await tx.productVariant.updateMany({ where: { id, stock: { gte: qty }, isActive: true }, data: { stock: { decrement: qty } } });
          if (updated.count !== 1) throw new Error("STOCK_CHANGED");
        }
        const created = await tx.order.create({ data: {
          orderNumber, accessToken: randomBytes(32).toString("hex"), userId: profile?.id, status: initialStatus,
          customerName: fields.customerName, customerEmail: fields.customerEmail, customerPhone: fields.customerPhone,
          recipientName: fields.recipientName, recipientPhone: fields.recipientPhone, address: fields.address, city: fields.city,
          postalCode: fields.postalCode || null, shippingZone: zone.name, deliveryDate, deliverySlot: fields.deliverySlot,
          cardMessage: fields.cardMessage || null, notes: fields.notes || null, subtotal, shippingFee: zone.fee, total,
          expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000), paymentMethod: fields.paymentMethod,
          items: { create: entries.map(([id, qty]) => { const row = byId.get(id)!; return { productId: row.productId, variantId: id, productName: row.product.name, variantName: row.name, price: row.price, qty, imageUrl: row.product.images[0]?.url ?? "", cardNote: cartItems.find((item) => item.variantId === id)?.note || null }; }) },
          payment: { create: { method: fields.paymentMethod, amount: total, status: PaymentStatus.PENDING, ...(bank ? { bankAccountId: bank.id } : {}), ...(qris ? { qrisAssetId: qris.id } : {}) } },
          statusLogs: { create: { toStatus: initialStatus, note: "Pesanan dibuat oleh pelanggan.", actorId: profile?.id ?? null } },
        } });
        return { id: created.id, orderNumber: created.orderNumber, accessToken: created.accessToken };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
    } catch (error) {
      if (error instanceof Error && error.message === "STOCK_CHANGED") return { error: "Stok berubah saat checkout. Perbarui keranjang dan coba kembali." };
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      if (attempt === 3) return { error: "Pesanan belum dapat dibuat. Periksa koneksi dan coba kembali." };
    }
  }
  if (!order) return { error: "Nomor pesanan belum dapat dibuat. Coba kembali." };

  await sendEmail({ to: fields.customerEmail, subject: `Pesanan dibuat · ${order.orderNumber}`, html: emailTemplate("Pesananmu sudah dibuat", `<p>Terima kasih, pesanan ${order.orderNumber} dengan total Rp ${total.toLocaleString("id-ID")} sudah tercatat.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/pesanan/${order.orderNumber}?t=${order.accessToken}">Buka halaman pesanan</a></p>`) });
  if (initialStatus === OrderStatus.MENUNGGU_QRIS && process.env.ADMIN_EMAIL) await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `QRIS perlu disiapkan · ${order.orderNumber}`, html: emailTemplate("Pesanan menunggu QRIS", `<p>Siapkan QRIS dengan nominal tepat Rp ${total.toLocaleString("id-ID")}.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/pembayaran">Buka antrean pembayaran</a></p>`) });

  if (hasProof && proofMeta?.success) {
    const extension = proofMeta.data.name.split(".").pop()?.toLowerCase() ?? "";
    const path = `proofs/${order.id}/${randomUUID()}.${extension}`;
    const admin = createAdminClient();
    const { data: signed, error } = await admin.storage.from("payment-proofs").createSignedUploadUrl(path);
    if (error || !signed) return { error: "Pesanan dibuat, tetapi bukti belum dapat diunggah. Unggah dari halaman pesanan." };
    return { upload: { orderNumber: order.orderNumber, token: order.accessToken, path, uploadToken: signed.token, type: proofMeta.data.type } };
  }
  redirect(`/pesanan/${order.orderNumber}?t=${order.accessToken}`);
}

export async function createProofUploadUrl(orderNumber: string, token: string | undefined, fileMeta: { name: string; type: string; size: number }) {
  const limit = await checkRateLimit("proof-upload", 5, 60 * 60 * 1000);
  if (!limit.allowed) throw new Error(limit.message);
  const order = await getAuthorizedOrder(orderNumber, token);
  if (!order || ![OrderStatus.MENUNGGU_BAYAR, OrderStatus.MENUNGGU_KONFIRMASI].some((status) => status === order.status)) throw new Error("Pesanan tidak ditemukan atau tidak dapat menerima bukti.");
  const extension = fileMeta.name.split(".").pop()?.toLowerCase() ?? "";
  if (fileMeta.size < 1 || fileMeta.size > 5 * 1024 * 1024 || proofTypes[extension] !== fileMeta.type) throw new Error("Pilih bukti JPG, PNG, WebP, atau PDF maksimal 5 MB.");
  const path = `proofs/${order.id}/${randomUUID()}.${extension}`;
  const { data, error } = await createAdminClient().storage.from("payment-proofs").createSignedUploadUrl(path);
  if (error || !data) throw new Error("Tautan unggah belum dapat dibuat.");
  return { path, token: data.token };
}

export async function confirmProofUploaded(orderNumber: string, token: string | undefined, path: string) {
  const order = await getAuthorizedOrder(orderNumber, token);
  if (!order || !path.startsWith(`proofs/${order.id}/`) || ![OrderStatus.MENUNGGU_BAYAR, OrderStatus.MENUNGGU_KONFIRMASI].some((status) => status === order.status)) throw new Error("Bukti tidak dapat dikonfirmasi untuk pesanan ini.");
  await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true } });
    await tx.payment.update({ where: { orderId: order.id }, data: { proofPath: path, proofUploadedAt: new Date(), status: PaymentStatus.SUBMITTED } });
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.MENUNGGU_KONFIRMASI } });
    await tx.orderStatusLog.create({ data: { orderId: order.id, fromStatus: current.status, toStatus: OrderStatus.MENUNGGU_KONFIRMASI, note: "Bukti pembayaran diterima.", actorId: order.userId } });
  });
  if (process.env.ADMIN_EMAIL) await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Bukti pembayaran perlu diperiksa · ${orderNumber}`, html: emailTemplate("Bukti pembayaran diterima", `<p>Pesanan ${orderNumber} menunggu pemeriksaan.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/pembayaran">Buka antrean konfirmasi</a></p>`) });
}

export async function switchOrderToBank(orderNumber: string, token: string | undefined) {
  const order = await getAuthorizedOrder(orderNumber, token);
  if (!order || ![OrderStatus.MENUNGGU_QRIS, OrderStatus.MENUNGGU_BAYAR].some((status) => status === order.status) || order.payment?.status === PaymentStatus.SUBMITTED) throw new Error("Metode pembayaran tidak dapat diubah.");
  const bank = await prisma.bankAccount.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  if (!bank) throw new Error("Rekening transfer belum tersedia.");
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { orderId: order.id }, data: { method: PaymentMethod.BANK, bankAccountId: bank.id, qrisAssetId: null } });
    await tx.order.update({ where: { id: order.id }, data: { paymentMethod: PaymentMethod.BANK, status: OrderStatus.MENUNGGU_BAYAR } });
    await tx.orderStatusLog.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: OrderStatus.MENUNGGU_BAYAR, note: "Pelanggan mengganti metode ke transfer bank.", actorId: order.userId } });
  });
}

async function getAuthorizedOrder(orderNumber: string, token?: string) {
  const profile = await getCurrentProfile();
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { payment: true } });
  if (!order || (order.userId !== profile?.id && !safeTokenEqual(order.accessToken, token))) return null;
  return order;
}
