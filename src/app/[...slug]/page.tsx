import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlockRenderer } from "@/components/cms/block-renderer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { pageBlocksSchema } from "@/lib/cms/blocks";
import { redirectOrLogNotFound } from "@/lib/redirect-handler";
import { headers } from "next/headers";

type Props = { params: { slug: string[] } };
export const revalidate=60;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.slug.length !== 1) return {};
  const page = await prisma.page.findFirst({ where: { slug: params.slug[0], status: "PUBLISHED" }, select: { title: true, blocks: true } });
  if (!page) return {};
  const textBlock = Array.isArray(page.blocks) ? (page.blocks as unknown as { type?: string; html?: string }[]).find((block) => block?.type === "teks") : undefined;
  const description = textBlock?.html?.replace(/<[^>]+>/g, " ").slice(0, 155);
  return buildMetadata({entityType:"PAGE",entityId:page.title?params.slug[0]:params.slug[0],title:page.title,description,path:`/${params.slug[0]}`});
}

export default async function CmsPublicPage({ params }: Props) {
  if (params.slug.length !== 1) notFound();
  const page = await prisma.page.findFirst({ where: { slug: params.slug[0], status: "PUBLISHED" } });
  if (!page) { await redirectOrLogNotFound(`/${params.slug.join("/")}`,headers().get("referer")); notFound(); }
  const blockList=pageBlocksSchema.safeParse(page.blocks).success?pageBlocksSchema.parse(page.blocks):[];
  const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Beranda",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:page.title,item:absoluteUrl(`/${page.slug}`)}]};
  const faq=blockList.find(block=>block.type==="faq");
  const faqSchema=faq?.type==="faq"?{"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.items.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}}))}:null;
  return <main className="page-content cms-public"><SiteHeader/><JsonLd data={breadcrumb}/>{faqSchema&&<JsonLd data={faqSchema}/>}<header className="floating-panel cms-title"><p className="eyebrow">radinkacraft</p><h1>{page.title}</h1></header><BlockRenderer blocks={page.blocks}/></main>;
}
