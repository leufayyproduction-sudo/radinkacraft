"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { blogContentSchema } from "@/lib/cms/sanitize";
import { persistSeoMeta,persistSlugRedirect } from "@/lib/seo-admin";

const schema = z.object({ id: z.string().optional(), slug: z.string().trim().min(1).max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().trim().min(1).max(180), excerpt: z.string().trim().min(1).max(500), coverImageUrl: z.string().max(1000).optional(), coverAlt: z.string().max(250).optional(), content: z.string().max(100000), status: z.enum(["DRAFT", "PUBLISHED"]), publishedAt: z.string().optional() });
export async function saveBlogPost(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({ id: formData.get("id") || undefined, slug: formData.get("slug"), title: formData.get("title"), excerpt: formData.get("excerpt"), coverImageUrl: formData.get("coverImageUrl") || "", coverAlt: formData.get("coverAlt") || "", content: formData.get("content"), status: formData.get("submitStatus") || "DRAFT", publishedAt: formData.get("publishedAt") || "" });
  if (!parsed.success) redirect("/admin/blog?error=Periksa%20data%20artikel");
  const safeContent = blogContentSchema.parse(parsed.data.content);
  const date = parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date();
  const data = { slug: parsed.data.slug, title: parsed.data.title, excerpt: parsed.data.excerpt, coverImageUrl: parsed.data.coverImageUrl || null, coverAlt: parsed.data.coverAlt || null, content: safeContent, status: parsed.data.status, publishedAt: parsed.data.status === "PUBLISHED" ? date : null, authorId: admin.id };
  const previous = parsed.data.id ? await prisma.blogPost.findUnique({ where: { id: parsed.data.id }, select: { slug: true } }) : null;
  try { if (parsed.data.id) await prisma.blogPost.update({ where: { id: parsed.data.id }, data }); else await prisma.blogPost.create({ data }); } catch { redirect("/admin/blog?error=Slug%20sudah%20digunakan%20atau%20artikel%20tidak%20ditemukan"); }
  const duplicate=await persistSeoMeta(formData,"BLOG_POST",parsed.data.slug,previous?.slug);if(previous&&previous.slug!==parsed.data.slug)await persistSlugRedirect(`/blog/${previous.slug}`,`/blog/${parsed.data.slug}`);
  revalidatePath("/blog"); if (previous) revalidatePath(`/blog/${previous.slug}`);
  revalidatePath(`/blog/${parsed.data.slug}`); redirect(`/admin/blog?success=${encodeURIComponent(duplicate?"Artikel tersimpan. Kata kunci SEO sudah digunakan entitas lain.":"Artikel tersimpan")}`);
}
export async function deleteBlogPost(formData: FormData) {
  await requireAdmin(); const id = z.string().min(1).safeParse(formData.get("id")); if (!id.success) return;
  const post = await prisma.blogPost.findUnique({ where: { id: id.data } }); if (!post) return;
  await prisma.blogPost.delete({ where: { id: post.id } }); revalidatePath("/blog"); revalidatePath(`/blog/${post.slug}`); redirect("/admin/blog?success=Artikel%20dihapus");
}
