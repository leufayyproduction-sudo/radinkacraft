"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeInvoice } from "@/lib/invoice";
import { emailTemplate, sendEmail } from "@/lib/email";

const idSchema = z.string().min(1);
const text = z.string().trim();
const qrisMaxSize = 5 * 1024 * 1024;
const qrisFileMetaSchema = z.object({ type: z.enum(["image/png", "image/jpeg", "image/webp"]), size: z.number().int().min(1).max(qrisMaxSize) });

function logQrisError(action: string, error: unknown) {
  const value = error && typeof error === "object" ? error as { message?: unknown; code?: unknown } : {};
  console.error(`[${action}]`, {
    message: typeof value.message === "string" ? value.message : "Kesalahan QRIS tidak diketahui.",
    ...(typeof value.code === "string" ? { code: value.code } : {}),
  });
}

function qrisStorageMessage(error: unknown) {
  const value = error && typeof error === "object" ? error as { message?: unknown; code?: unknown } : {};
  const detail = `${String(value.code ?? "")} ${String(value.message ?? "")}`;
  if (/bucket.{0,20}(not[\s_-]*found|does not exist)|no such bucket/i.test(detail)) {
    return "Bucket QRIS belum tersedia. Jalankan npm run storage:setup dengan environment produksi.";
  }
  return "Penyimpanan QRIS belum dapat diakses. Periksa koneksi Supabase dan coba kembali.";
}

export async function saveBankAccount(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: text.optional(), bankName: text.min(2).max(80), accountNumber: text.min(3).max(40), accountHolder: text.min(2).max(100), logoUrl: z.union([z.string().url(), z.literal("")]), sortOrder: z.coerce.number().int().min(0), isActive: z.boolean() }).safeParse({ id: formData.get("id") || undefined, bankName: formData.get("bankName"), accountNumber: formData.get("accountNumber"), accountHolder: formData.get("accountHolder"), logoUrl: formData.get("logoUrl") || "", sortOrder: formData.get("sortOrder"), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) throw new Error("Periksa data rekening bank.");
  const { id, ...data } = parsed.data; const value = { ...data, logoUrl: data.logoUrl || null };
  if (id) await prisma.bankAccount.update({ where: { id }, data: value }); else await prisma.bankAccount.create({ data: value });
  revalidatePath("/checkout"); revalidatePath("/admin/rekening");
}

export async function deleteBankAccount(id: string) {
  await requireAdmin(); const parsed = idSchema.safeParse(id); if (!parsed.success) return { error: "Rekening tidak valid." };
  const row = await prisma.bankAccount.findUnique({ where: { id: parsed.data }, include: { _count: { select: { payments: true } } } });
  if (!row) return { error: "Rekening tidak ditemukan." };
  if (row._count.payments) return { error: "Rekening pernah dipakai. Nonaktifkan rekening sebagai gantinya." };
  await prisma.bankAccount.delete({ where: { id: row.id } }); revalidatePath("/checkout"); revalidatePath("/admin/rekening"); return { ok: true };
}

export async function moveBankAccount(id: string, direction: -1 | 1) {
  await requireAdmin(); const parsed = z.object({ id: idSchema, direction: z.union([z.literal(-1), z.literal(1)]) }).safeParse({ id, direction }); if (!parsed.success) return;
  const rows = await prisma.bankAccount.findMany({ orderBy: [{ sortOrder: "asc" }, { bankName: "asc" }] }); const index = rows.findIndex((row) => row.id === parsed.data.id); const target = rows[index + direction]; if (index < 0 || !target) return;
  await prisma.$transaction([prisma.bankAccount.update({ where: { id: rows[index].id }, data: { sortOrder: target.sortOrder } }), prisma.bankAccount.update({ where: { id: target.id }, data: { sortOrder: rows[index].sortOrder } })]); revalidatePath("/admin/rekening"); revalidatePath("/checkout");
}

export async function qrisUploadUrl(file: { type: string; size: number }) {
  await requireAdmin();
  const parsed = qrisFileMetaSchema.safeParse(file);
  if (!parsed.success) {
    return { error: parsed.error.issues.some((issue) => issue.path[0] === "size") ? "File terlalu besar atau kosong, maksimal 5 MB." : "Format gambar QRIS harus PNG, JPG, atau WebP." };
  }
  const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[parsed.data.type];
  const path = `library/${crypto.randomUUID()}.${extension}`;
  try {
    const { data, error } = await createAdminClient().storage.from("qris").createSignedUploadUrl(path);
    if (error || !data) {
      logQrisError("qrisUploadUrl", error ?? new Error("Signed upload URL tidak dikembalikan."));
      return { error: qrisStorageMessage(error) };
    }
    return { path, token: data.token };
  } catch (error) {
    logQrisError("qrisUploadUrl", error);
    return { error: qrisStorageMessage(error) };
  }
}

export async function saveQrisAsset(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: text.optional(), amount: z.coerce.number().int().positive(), imagePath: z.string().regex(/^library\/[\w-]+\.(?:webp|png|jpe?g)$/), label: text.max(120), isActive: z.boolean() }).safeParse({ id: formData.get("id") || undefined, amount: formData.get("amount"), imagePath: formData.get("imagePath"), label: formData.get("label") || "", isActive: formData.get("isActive") === "on" });
  if (!parsed.success) return { error: "Periksa nominal dan gambar QRIS. Format gambar harus PNG, JPG, atau WebP, maksimal 5 MB." };
  const { id, ...data } = parsed.data;
  try { if (id) await prisma.qrisAsset.update({ where: { id }, data: { ...data, label: data.label || null } }); else await prisma.qrisAsset.create({ data: { ...data, label: data.label || null } }); }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
    if (code === "P2002") return { error: "Nominal QRIS sudah dipakai. Ubah entri yang sudah ada." };
    logQrisError("saveQrisAsset", error);
    return { error: "QRIS gagal disimpan. Periksa koneksi database dan coba kembali." };
  }
  revalidatePath("/admin/qris"); revalidatePath("/checkout");
  return { ok: true as const };
}

export async function deleteQrisAsset(id: string) {
  await requireAdmin(); const parsed = idSchema.safeParse(id); if (!parsed.success) return { error: "QRIS tidak valid." };
  const row = await prisma.qrisAsset.findUnique({ where: { id: parsed.data }, include: { _count: { select: { payments: true } } } });
  if (!row) return { error: "QRIS tidak ditemukan." };
  if (row._count.payments) { await prisma.qrisAsset.update({ where: { id: row.id }, data: { isActive: false } }); return { error: "QRIS pernah dipakai dan dinonaktifkan." }; }
  await prisma.qrisAsset.delete({ where: { id: row.id } }); revalidatePath("/admin/qris"); return { ok: true };
}

export async function decidePayment(orderId: string, decision: "confirm" | "reject", reason = "") {
  const admin = await requireAdmin();
  const parsed = z.object({ orderId: idSchema, decision: z.enum(["confirm", "reject"]), reason: text.max(500) }).safeParse({ orderId, decision, reason });
  if (!parsed.success || (decision === "reject" && parsed.data.reason.length < 3)) return { error: "Alasan penolakan wajib diisi." };
  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId }, include: { items: true, payment: true } });
  if (!order || order.status !== OrderStatus.MENUNGGU_KONFIRMASI || !order.payment) return { error: "Pesanan tidak berada di antrean konfirmasi." };
  if (decision === "confirm") {
    let invoice;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        invoice = await prisma.$transaction(async (tx) => {
          const current = await tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, payment: true } });
          if (current.status !== OrderStatus.MENUNGGU_KONFIRMASI || !current.payment || current.payment.status !== PaymentStatus.SUBMITTED) throw new Error("Pembayaran sudah diproses.");
          await tx.payment.update({ where: { orderId: order.id }, data: { status: PaymentStatus.CONFIRMED, confirmedById: admin.id, confirmedAt: new Date() } });
          await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.DIBAYAR } });
          const created = await makeInvoice(tx, current);
          await tx.orderStatusLog.create({ data: { orderId: order.id, fromStatus: current.status, toStatus: OrderStatus.DIBAYAR, note: "Pembayaran dikonfirmasi.", actorId: admin.id } });
          return created;
        }); break;
      } catch (error) { if (attempt === 2) return { error: error instanceof Error ? error.message : "Invoice belum dapat dibuat." }; }
    }
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/invoice/${order.orderNumber}?t=${order.accessToken}`;
    await sendEmail({ to: order.customerEmail, subject: `Pembayaran dikonfirmasi · ${invoice?.invoiceNumber ?? order.orderNumber}`, html: emailTemplate("Pembayaran telah dikonfirmasi", `<p>Pembayaran untuk pesanan <b>${order.orderNumber}</b> sudah diterima.</p><p><a href="${link}">Unduh invoice</a></p>`) });
  } else {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true, payment: true } });
      if (current.status !== OrderStatus.MENUNGGU_KONFIRMASI || !current.payment) throw new Error("Pembayaran sudah diproses.");
      await tx.payment.update({ where: { orderId: order.id }, data: { status: PaymentStatus.REJECTED, rejectReason: parsed.data.reason, confirmedById: admin.id, confirmedAt: new Date() } });
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.MENUNGGU_BAYAR } });
      await tx.orderStatusLog.create({ data: { orderId: order.id, fromStatus: current.status, toStatus: OrderStatus.MENUNGGU_BAYAR, note: `Bukti ditolak: ${parsed.data.reason}`, actorId: admin.id } });
    });
    await sendEmail({ to: order.customerEmail, subject: `Bukti pembayaran perlu diperbaiki · ${order.orderNumber}`, html: emailTemplate("Bukti pembayaran perlu diperbaiki", `<p>Alasan: ${parsed.data.reason}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/pesanan/${order.orderNumber}?t=${order.accessToken}">Unggah ulang bukti</a></p>`) });
  }
  revalidatePath("/admin/pembayaran"); revalidatePath("/admin/pesanan"); revalidatePath(`/admin/pesanan/${order.orderNumber}`); revalidatePath(`/pesanan/${order.orderNumber}`); revalidatePath("/akun");
  return { ok: true };
}

export async function prepareOrderQris(orderId: string, imagePath: string, label: string, saveToLibrary: boolean) {
  const admin = await requireAdmin();
  const parsed = z.object({ orderId: idSchema, imagePath: z.string().regex(/^library\/[\w-]+\.(?:webp|png|jpe?g)$/), label: text.max(120), saveToLibrary: z.boolean() }).safeParse({ orderId, imagePath, label, saveToLibrary });
  if (!parsed.success) return { error: "Data QRIS tidak valid." };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || order.status !== OrderStatus.MENUNGGU_QRIS || !order.payment) return { error: "Pesanan tidak sedang menunggu QRIS." };
  let asset = await prisma.qrisAsset.findUnique({ where: { amount: order.total } });
  try {
    if (asset) { if (parsed.data.saveToLibrary && !asset.isActive) asset = await prisma.qrisAsset.update({ where: { id: asset.id }, data: { isActive: true } }); }
    else asset = await prisma.qrisAsset.create({ data: { amount: order.total, imagePath, label: parsed.data.label || null, isActive: parsed.data.saveToLibrary } });
  } catch { return { error: "QRIS untuk nominal ini sedang digunakan transaksi lain." }; }
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { orderId }, data: { method: PaymentMethod.QRIS, qrisAssetId: asset!.id } });
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.MENUNGGU_BAYAR, paymentMethod: PaymentMethod.QRIS } });
    await tx.orderStatusLog.create({ data: { orderId, fromStatus: OrderStatus.MENUNGGU_QRIS, toStatus: OrderStatus.MENUNGGU_BAYAR, note: "QRIS disiapkan oleh admin.", actorId: admin.id } });
  });
  await sendEmail({ to: order.customerEmail, subject: `QRIS siap · ${order.orderNumber}`, html: emailTemplate("QRIS siap digunakan", `<p>Admin telah menyiapkan QRIS untuk ${order.orderNumber}. Bayar tepat Rp ${order.total.toLocaleString("id-ID")}.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/pesanan/${order.orderNumber}?t=${order.accessToken}">Lihat QRIS dan instruksi pembayaran</a></p>`) });
  revalidatePath("/admin/pembayaran"); revalidatePath(`/admin/pesanan/${order.orderNumber}`); revalidatePath(`/pesanan/${order.orderNumber}`); revalidatePath("/admin/qris"); return { ok: true };
}

export async function resendInvoiceEmail(orderId: string) {
  await requireAdmin(); const parsed = idSchema.safeParse(orderId); if (!parsed.success) return { error: "Pesanan tidak valid." };
  const order = await prisma.order.findUnique({ where: { id: parsed.data }, include: { invoice: true } });
  if (!order?.invoice) return { error: "Invoice belum tersedia." };
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/invoice/${order.orderNumber}?t=${order.accessToken}`;
  await sendEmail({ to: order.customerEmail, subject: `Invoice ${order.invoice.invoiceNumber} · radinkacraft`, html: emailTemplate("Invoice pesanan", `<p>Invoice ${order.invoice.invoiceNumber} terlampir pada pesanan ${order.orderNumber}.</p><p><a href="${url}">Unduh invoice</a></p>`) }); return { ok: true };
}
