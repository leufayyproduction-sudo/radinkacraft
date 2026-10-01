import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminPageEditor } from "@/components/cms/admin-page-editor";
import type { MediaOption } from "@/components/admin-ui";

export default async function EditCmsPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const [page, media, revisions, products] = await Promise.all([prisma.page.findUnique({ where: { id: params.id } }), prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 }), prisma.pageRevision.findMany({ where: { pageId: params.id }, orderBy: { createdAt: "desc" }, take: 20 }), prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  if (!page) notFound();
  const seo=await prisma.seoMeta.findUnique({where:{entityType_entityId:{entityType:"PAGE",entityId:page.slug}}});
  return <><div className="admin-page-heading"><div><p className="eyebrow">Editor blok</p><h1>{page.title}</h1></div></div><AdminPageEditor page={page} media={media as MediaOption[]} revisions={revisions} products={products} seo={seo}/></>;
}
