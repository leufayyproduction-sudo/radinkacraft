"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { pageBlocksSchema } from "@/lib/cms/blocks";
import { sanitizeBlocks } from "@/lib/cms/sanitize";
import { persistSeoMeta, persistSlugRedirect } from "@/lib/seo-admin";

const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const forbidden = new Set(["admin", "api", "toko", "produk", "kategori", "keranjang", "checkout", "pesanan", "akun", "masuk", "daftar", "ulasan", "blog", "sitemap", "robots"]);
const pageInput = z.object({ id: z.string().optional(), title: z.string().trim().min(1).max(150), slug: slugSchema, blocks: pageBlocksSchema, status: z.enum(["DRAFT", "PUBLISHED"]) });

export async function createPage(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ title: z.string().trim().min(1).max(150), slug: slugSchema }).safeParse({ title: formData.get("title"), slug: formData.get("slug") });
  if (!parsed.success || forbidden.has(parsed.data?.slug ?? "")) redirect("/admin/halaman?error=Judul%20atau%20slug%20tidak%20valid");
  let page;
  try { page = await prisma.page.create({ data: { ...parsed.data, blocks: [], status: "DRAFT" } }); } catch { redirect("/admin/halaman?error=Slug%20sudah%20digunakan"); }
  redirect(`/admin/halaman/${page.id}`);
}

export async function savePage(formData: FormData) {
  const admin = await requireAdmin();
  let blocks: unknown; try { blocks = JSON.parse(String(formData.get("blocks") || "[]")); } catch { redirect("/admin/halaman?error=Konten%20blok%20tidak%20valid"); }
  const parsed = pageInput.safeParse({ id: formData.get("id"), title: formData.get("title"), slug: formData.get("slug"), blocks, status: formData.get("submitStatus") || formData.get("status") });
  if (!parsed.success || (parsed.data.id && forbidden.has(parsed.data.slug))) redirect("/admin/halaman?error=Periksa%20judul%2C%20slug%2C%20dan%20blok");
  const page = await prisma.page.findUnique({ where: { id: parsed.data.id } });
  if (!page) redirect("/admin/halaman?error=Halaman%20tidak%20ditemukan");
  if (page.isSystem && page.slug !== parsed.data.slug) redirect(`/admin/halaman/${page.id}?error=Slug%20halaman%20bawaan%20tidak%20dapat%20diubah`);
  const safeBlocks = sanitizeBlocks(parsed.data.blocks);
  await prisma.$transaction(async (tx) => {
    await tx.pageRevision.create({ data: { pageId: page.id, title: page.title, blocks: page.blocks as any, createdById: admin.id } });
    await tx.page.update({ where: { id: page.id }, data: { title: parsed.data.title, slug: parsed.data.slug, blocks: safeBlocks as any, status: parsed.data.status, publishedAt: parsed.data.status === "PUBLISHED" ? page.publishedAt ?? new Date() : page.publishedAt } });
    const old = await tx.pageRevision.findMany({ where: { pageId: page.id }, orderBy: { createdAt: "desc" }, skip: 20, select: { id: true } });
    if (old.length) await tx.pageRevision.deleteMany({ where: { id: { in: old.map((row) => row.id) } } });
  });
  const duplicate=await persistSeoMeta(formData,"PAGE",parsed.data.slug,page.slug);if(page.slug!==parsed.data.slug)await persistSlugRedirect(`/${page.slug}`,`/${parsed.data.slug}`);
  if (page.status === "PUBLISHED") revalidatePath(`/${page.slug}`);
  if (parsed.data.status === "PUBLISHED") revalidatePath(`/${parsed.data.slug}`);
  revalidatePath("/");
  redirect(`/admin/halaman/${page.id}?success=${encodeURIComponent(duplicate?"Halaman tersimpan. Kata kunci SEO sudah digunakan entitas lain.":"Halaman tersimpan")}`);
}

export async function restorePageRevision(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ pageId: z.string().min(1), revisionId: z.string().min(1) }).safeParse({ pageId: formData.get("pageId"), revisionId: formData.get("revisionId") });
  if (!parsed.success) return;
  const [page, revision] = await Promise.all([prisma.page.findUnique({ where: { id: parsed.data.pageId } }), prisma.pageRevision.findFirst({ where: { id: parsed.data.revisionId, pageId: parsed.data.pageId } })]);
  if (!page || !revision) return;
  const restored = sanitizeBlocks(revision.blocks);
  await prisma.$transaction(async (tx) => {
    await tx.pageRevision.create({ data: { pageId: page.id, title: page.title, blocks: page.blocks as any, createdById: admin.id } });
    await tx.page.update({ where: { id: page.id }, data: { title: revision.title, blocks: restored as any } });
  });
  revalidatePath("/"); revalidatePath(`/${page.slug}`);
}

export async function deletePage(formData: FormData) {
  await requireAdmin(); const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return;
  const page = await prisma.page.findUnique({ where: { id: id.data } });
  if (!page || page.isSystem) redirect("/admin/halaman?error=Halaman%20bawaan%20tidak%20dapat%20dihapus");
  await prisma.page.delete({ where: { id: page.id } }); revalidatePath(`/${page.slug}`); redirect("/admin/halaman?success=Halaman%20dihapus");
}
