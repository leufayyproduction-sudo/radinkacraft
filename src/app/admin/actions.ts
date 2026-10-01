"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { OrderStatus, PaymentStatus, ProductStatus, TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailTemplate, sendEmail } from "@/lib/email";
import { persistSeoMeta, persistSlugRedirect } from "@/lib/seo-admin";

const text = z.string().trim();
const idSchema = z.string().min(1);
const categorySchema = z.object({ id: text.optional(), name: text.min(2), slug: text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: text.optional(), imageUrl: z.union([z.string().url(), z.literal("")]).optional(), sortOrder: z.coerce.number().int().min(0), isActive: z.boolean() });
const variantSchema = z.object({ id: text.optional(), name: text.min(1), price: z.coerce.number().int().min(0), compareAtPrice: z.preprocess((value) => value === "" || value === undefined ? null : value, z.coerce.number().int().min(0).nullable()), stock: z.coerce.number().int().min(0), sku: text.optional(), sortOrder: z.coerce.number().int().min(0), isActive: z.boolean() });
const imageSchema = z.object({ url: z.string().url(), alt: text, sortOrder: z.number().int().min(0), isPrimary: z.boolean(), blendMultiply: z.boolean() });
const productSchema = z.object({ id: text.optional(), name: text.min(2), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: text.min(2), description: text.min(2), categoryId: idSchema, status: z.nativeEnum(ProductStatus), isFeatured: z.boolean(), images: z.array(imageSchema), variants: z.array(variantSchema).min(1) });
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const revalidatePublic = (slug?: string) => { revalidatePath("/"); revalidatePath("/toko"); if (slug) revalidatePath(`/produk/${slug}`); };

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const parsed = categorySchema.safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), slug: formData.get("slug") || slugify(String(formData.get("name") || "")), description: formData.get("description") || "", imageUrl: formData.get("imageUrl") || "", sortOrder: formData.get("sortOrder"), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) redirect("/admin/kategori?error=Periksa%20data%20kategori");
  const { id, ...data } = parsed.data;const previous=id?await prisma.category.findUnique({where:{id},select:{slug:true}}):null;
  let saved;try { if (id) saved=await prisma.category.update({ where: { id }, data }); else saved=await prisma.category.create({ data }); } catch { redirect("/admin/kategori?error=Slug%20kategori%20sudah%20digunakan"); }
  const duplicate=await persistSeoMeta(formData,"CATEGORY",saved.slug,previous?.slug);if(previous&&previous.slug!==saved.slug)await persistSlugRedirect(`/kategori/${previous.slug}`,`/kategori/${saved.slug}`);
  revalidatePublic();revalidatePath(`/kategori/${saved.slug}`); if(previous)revalidatePath(`/kategori/${previous.slug}`); redirect(`/admin/kategori?success=${encodeURIComponent(duplicate?"Kategori tersimpan. Kata kunci SEO sudah digunakan entitas lain.":"Kategori tersimpan")}`);
}

export async function deleteCategory(id: string) {
  await requireAdmin(); const valid = idSchema.safeParse(id); if (!valid.success) return { error: "Kategori tidak valid." };
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return { error: "Kategori tidak ditemukan." };
  if (category._count.products) return { error: "Kategori masih memiliki produk. Nonaktifkan kategori sebagai gantinya." };
  await prisma.category.delete({ where: { id } }); revalidatePublic(); return { ok: true };
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  let images: unknown, variants: unknown;
  try { images = JSON.parse(String(formData.get("images") || "[]")); variants = JSON.parse(String(formData.get("variants") || "[]")); } catch { redirect("/admin/produk?error=Data%20produk%20tidak%20terbaca"); }
  const parsed = productSchema.safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), slug: formData.get("slug") || slugify(String(formData.get("name") || "")), shortDescription: formData.get("shortDescription"), description: formData.get("description"), categoryId: formData.get("categoryId"), status: formData.get("status"), isFeatured: formData.get("isFeatured") === "on", images, variants });
  if (!parsed.success) redirect("/admin/produk?error=Periksa%20semua%20data%20produk%20dan%20varian");
  if (parsed.data.status === ProductStatus.PUBLISHED && !parsed.data.variants.some((variant) => variant.isActive)) redirect("/admin/produk?error=Produk%20terbit%20memerlukan%20minimal%20satu%20varian%20aktif");
  const { id, images: imageRows, variants: variantRows, ...data } = parsed.data;
  const variantsData = variantRows.map((variant) => ({ ...variant, sku: variant.sku || null }));
  let oldSlug: string | undefined;
  try {
    if (id) {
      const existing = await prisma.product.findUniqueOrThrow({ where: { id }, select: { slug: true } }); oldSlug = existing.slug;
      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data: { ...data, images: { deleteMany: {}, create: imageRows }, variants: { deleteMany: {}, create: variantsData } } });
      });
    } else await prisma.product.create({ data: { ...data, images: { create: imageRows }, variants: { create: variantsData } } });
  } catch { redirect("/admin/produk?error=Slug%20atau%20SKU%20sudah%20digunakan%2C%20atau%20data%20tidak%20valid"); }
  const duplicate=await persistSeoMeta(formData,"PRODUCT",parsed.data.slug,oldSlug);if(oldSlug&&oldSlug!==parsed.data.slug)await persistSlugRedirect(`/produk/${oldSlug}`,`/produk/${parsed.data.slug}`);
  revalidatePublic(oldSlug); revalidatePublic(parsed.data.slug); redirect(`/admin/produk?success=${encodeURIComponent(duplicate?"Produk tersimpan. Kata kunci SEO sudah digunakan entitas lain.":"Produk tersimpan")}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin(); const valid = idSchema.safeParse(id); if (!valid.success) return { error: "Produk tidak valid." };
  const product = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } }); if (!product) return { error: "Produk tidak ditemukan." };
  if (product._count.orderItems) return { error: "Produk punya riwayat pesanan. Ubah statusnya menjadi Draf untuk mengarsipkan." };
  await prisma.product.delete({ where: { id } }); revalidatePublic(product.slug); return { ok: true };
}

const mediaMetaSchema = z.object({ path: z.string().regex(/^library\/[a-zA-Z0-9-]+\.webp$/), width: z.number().int().positive().max(1600), height: z.number().int().positive().max(1600), sizeBytes: z.number().int().positive().max(5 * 1024 * 1024), mimeType: z.literal("image/webp"), alt: text.max(250) });
export async function mediaUploadUrl() {
  await requireAdmin(); const path = `library/${crypto.randomUUID()}.webp`; const { data, error } = await createAdminClient().storage.from("media").createSignedUploadUrl(path);
  if (error || !data) throw new Error("Tautan unggah media tidak tersedia."); return { path, token: data.token };
}
export async function registerMedia(input: unknown) {
  await requireAdmin(); const parsed = mediaMetaSchema.safeParse(input); if (!parsed.success) throw new Error("Data gambar tidak valid.");
  const url = createAdminClient().storage.from("media").getPublicUrl(parsed.data.path).data.publicUrl;
  const record = await prisma.media.create({ data: { ...parsed.data, url } }); return record;
}
export async function updateMediaAlt(id: string, alt: string) {
  await requireAdmin(); const parsed = z.object({ id: idSchema, alt: text.max(250) }).safeParse({ id, alt }); if (!parsed.success) return { error: "Teks alternatif tidak valid." };
  await prisma.media.update({ where: { id }, data: { alt } }); revalidatePublic(); return { ok: true };
}
export async function deleteMedia(id: string) {
  await requireAdmin(); const parsed = idSchema.safeParse(id); if (!parsed.success) return { error: "Media tidak valid." };
  const media = await prisma.media.findUnique({ where: { id } }); if (!media) return { error: "Media tidak ditemukan." };
  const { error } = await createAdminClient().storage.from("media").remove([media.path]); if (error) return { error: "File belum dapat dihapus dari Storage." };
  await prisma.media.delete({ where: { id } }); revalidatePublic(); return { ok: true };
}

export async function updateOrderStatus(id: string, next: OrderStatus, note = "") {
  const admin = await requireAdmin(); const parsed = z.object({ id: idSchema, next: z.nativeEnum(OrderStatus), note: text.max(500) }).safeParse({ id, next, note }); if (!parsed.success) return { error: "Perubahan status tidak valid." };
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = { DIBAYAR: [OrderStatus.DIPROSES], DIPROSES: [OrderStatus.DIKIRIM], DIKIRIM: [OrderStatus.SELESAI] };
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } }); if (!order || !allowed[order.status]?.includes(next)) return { error: "Urutan status pesanan tidak sesuai." };
  await prisma.$transaction(async (tx) => { await tx.order.update({ where: { id }, data: { status: next } }); await tx.orderStatusLog.create({ data: { orderId: id, fromStatus: order.status, toStatus: next, note: parsed.data.note || null, actorId: admin.id } }); });
  if (next === OrderStatus.DIKIRIM) await sendEmail({ to: order.customerEmail, subject: `Pesanan dikirim · ${order.orderNumber}`, html: emailTemplate("Pesananmu sedang dikirim", `<p>Pesanan ${order.orderNumber} sudah dikirim menuju ${order.recipientName}.</p>`) });
  revalidatePath("/admin/pesanan"); revalidatePath(`/admin/pesanan/${order.orderNumber}`); revalidatePath(`/pesanan/${order.orderNumber}`); return { ok: true };
}
export async function cancelAdminOrder(id: string, reason: string) {
  const admin = await requireAdmin(); const parsed = z.object({ id: idSchema, reason: text.min(3).max(500) }).safeParse({ id, reason }); if (!parsed.success) return { error: "Alasan pembatalan wajib diisi." };
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } }); if (!order || order.status === OrderStatus.SELESAI || order.status === OrderStatus.DIBATALKAN) return { error: "Pesanan ini tidak dapat dibatalkan." };
  await prisma.$transaction(async (tx) => { for (const item of order.items) if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } }).catch(() => undefined); await tx.order.update({ where: { id }, data: { status: OrderStatus.DIBATALKAN } }); await tx.orderStatusLog.create({ data: { orderId: id, fromStatus: order.status, toStatus: OrderStatus.DIBATALKAN, note: parsed.data.reason, actorId: admin.id } }); });
  await sendEmail({ to: order.customerEmail, subject: `Pesanan dibatalkan · ${order.orderNumber}`, html: emailTemplate("Pesanan dibatalkan", `<p>Pesanan ${order.orderNumber} dibatalkan.</p><p>Alasan: ${parsed.data.reason}</p>`) });
  revalidatePath("/admin/pesanan"); revalidatePath(`/admin/pesanan/${order.orderNumber}`); revalidatePath(`/pesanan/${order.orderNumber}`); revalidatePublic(); return { ok: true };
}

export async function saveSettings(formData: FormData) {
  await requireAdmin(); let zones: unknown; try { zones = JSON.parse(String(formData.get("zones") || "[]")); } catch { redirect("/admin/pengaturan?error=Data%20zona%20tidak%20valid"); }
  const parsed = z.object({ zones: z.array(z.object({ name: text.min(2), fee: z.coerce.number().int().min(0) })).min(1), expiry: z.coerce.number().int().min(1).max(168), store: z.object({ name: text.min(2).max(100), address: text.max(500), phone: text.max(40), whatsapp: z.union([z.string().regex(/^62[0-9]{8,13}$/), z.literal("")]), email: z.union([z.string().email(), z.literal("")]), logoUrl: z.union([z.string().url(), z.literal("")]), invoiceFooter: text.max(500) }) }).safeParse({ zones, expiry: formData.get("expiry"), store: { name: formData.get("storeName"), address: formData.get("storeAddress") || "", phone: formData.get("storePhone") || "", whatsapp: formData.get("storeWhatsapp") || "", email: formData.get("storeEmail") || "", logoUrl: formData.get("storeLogoUrl") || "", invoiceFooter: formData.get("storeInvoiceFooter") || "" } });
  if (!parsed.success) redirect("/admin/pengaturan?error=Periksa%20nama%20zona%20dan%20ongkir");
  await prisma.$transaction([prisma.setting.upsert({ where: { key: "shipping" }, create: { key: "shipping", value: parsed.data.zones }, update: { value: parsed.data.zones } }), prisma.setting.upsert({ where: { key: "paymentExpiryHours" }, create: { key: "paymentExpiryHours", value: parsed.data.expiry }, update: { value: parsed.data.expiry } }), prisma.setting.upsert({ where: { key: "store" }, create: { key: "store", value: { ...parsed.data.store, logoUrl: parsed.data.store.logoUrl || null } }, update: { value: { ...parsed.data.store, logoUrl: parsed.data.store.logoUrl || null } } })]);
  revalidatePath("/checkout"); revalidatePath("/admin/pengaturan"); redirect("/admin/pengaturan?success=Pengaturan%20tersimpan");
}

export async function saveHeroSlide(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: text.optional(), title: text.min(2), description: text.min(2), imageUrl: z.string().url(), imageAlt: text.min(1).max(250), blendMultiply: z.boolean(), productId: text.optional(), sortOrder: z.number().int().min(0), isActive: z.boolean() }).safeParse({ id: formData.get("id") || undefined, title: formData.get("title"), description: formData.get("description"), imageUrl: formData.get("imageUrl"), imageAlt: formData.get("imageAlt") || "", blendMultiply: formData.get("blendMultiply") === "on", productId: formData.get("productId") || undefined, sortOrder: Number(formData.get("sortOrder") || 0), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) redirect("/admin/hero?error=Periksa%20data%20hero"); const { id, ...data } = parsed.data;
  const productId = data.productId && await prisma.product.findFirst({ where: { id: data.productId, status: ProductStatus.PUBLISHED } }) ? data.productId : null;
  if (id) await prisma.heroSlide.update({ where: { id }, data: { ...data, productId } }); else await prisma.heroSlide.create({ data: { ...data, productId } });
  revalidatePath("/"); redirect("/admin/hero?success=Hero%20tersimpan");
}
export async function deleteHeroSlide(id: string) { await requireAdmin(); const parsed=idSchema.safeParse(id); if(!parsed.success)return {error:"Slide tidak valid."}; await prisma.heroSlide.delete({ where: { id: parsed.data } }); revalidatePath("/"); return { ok: true }; }
export async function moveHeroSlide(id: string, direction: -1 | 1) { await requireAdmin(); const valid = z.object({ id: idSchema, direction: z.union([z.literal(-1), z.literal(1)]) }).safeParse({ id, direction }); if (!valid.success) return; const rows = await prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } }); const index = rows.findIndex((row) => row.id === id); const target = rows[index + direction]; if (index < 0 || !target) return; await prisma.$transaction([prisma.heroSlide.update({ where: { id }, data: { sortOrder: target.sortOrder } }), prisma.heroSlide.update({ where: { id: target.id }, data: { sortOrder: rows[index].sortOrder } })]); revalidatePath("/"); }

export async function moderateReview(id: string, status: TestimonialStatus) { await requireAdmin(); const parsed = z.object({ id: idSchema, status: z.nativeEnum(TestimonialStatus) }).safeParse({ id, status }); if (!parsed.success) return; await prisma.testimonial.update({ where: { id }, data: { status } }); revalidatePath("/"); revalidatePath("/ulasan"); }
export async function deleteReview(id: string) { await requireAdmin(); const parsed = idSchema.safeParse(id); if (!parsed.success) return; await prisma.testimonial.delete({ where: { id: parsed.data } }); revalidatePath("/"); revalidatePath("/ulasan"); }
export async function deleteSampleReviews(confirmed: string) { await requireAdmin(); if (!z.literal("HAPUS ULASAN CONTOH").safeParse(confirmed).success) return { error: "Konfirmasi kedua tidak cocok." }; await prisma.testimonial.deleteMany({ where: { isSample: true } }); revalidatePath("/"); revalidatePath("/ulasan"); return { ok: true }; }
