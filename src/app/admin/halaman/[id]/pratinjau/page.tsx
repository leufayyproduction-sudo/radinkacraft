import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { BlockRenderer } from "@/components/cms/block-renderer";
import { SiteHeader } from "@/components/site-header";

export default async function CmsPreview({ params, searchParams }: { params: { id: string }; searchParams: { mobile?: string } }) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) notFound();
  return <main className={`page-content cms-public cms-preview${searchParams.mobile === "1" ? " is-mobile-preview" : ""}`}><SiteHeader/><header className="floating-panel cms-panel"><small>Pratinjau draf · {searchParams.mobile === "1" ? "HP" : "Desktop"}</small><h1>{page.title}</h1></header><BlockRenderer blocks={page.blocks}/></main>;
}
