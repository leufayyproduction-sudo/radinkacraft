import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { SiteHeader } from "@/components/site-header";
import { ProductReviewForm } from "@/components/product-review-form";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeTokenEqual } from "@/lib/token";
export const dynamic="force-dynamic";
export const revalidate=0;

export default async function WriteProductReview({ params, searchParams }: { params: { itemId: string }; searchParams: { t?: string } }) {
  const profile = await getCurrentProfile().catch(() => null);
  const item = await prisma.orderItem.findUnique({ where: { id: params.itemId }, include: { order: true, product: true, review: { include: { photos: { orderBy: { sortOrder: "asc" } } } } } });
  if (!item || item.order.status !== OrderStatus.SELESAI || !item.product || (item.order.userId !== profile?.id && !safeTokenEqual(item.order.accessToken, searchParams.t))) notFound();
  const canEdit = !item.review || Date.now() - item.review.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
  return <><SiteHeader/><main className="product-review-page"><nav className="breadcrumbs"><Link href="/">Beranda</Link><span>/</span><Link href={"/produk/"+item.product.slug}>{item.product.name}</Link><span>/</span><span>Ulasan</span></nav><section className="floating-panel product-review-write"><p className="eyebrow">Pembeli terverifikasi</p><h1>{item.review?"Ubah ulasan":"Beri ulasan"}</h1><p>{item.product.name} · ukuran {item.variantName} · pesanan {item.order.orderNumber}</p><ProductReviewForm orderItemId={item.id} token={searchParams.t} displayName={profile?.name||item.order.customerName} review={item.review} canEdit={canEdit}/></section></main></>;
}
