import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatusView } from "@/components/order-status";
import { SiteHeader } from "@/components/site-header";
import { ProductReviewLink } from "@/components/product-review-link";
import { noindexMetadata } from "@/lib/noindex";
import { safeTokenEqual } from "@/lib/token";
export const dynamic="force-dynamic";
export const revalidate=0;
export const metadata=noindexMetadata;

export default async function OrderPage({ params, searchParams }: { params: { number: string }; searchParams: { t?: string } }) {
  const profile = await getCurrentProfile().catch(() => null);
  const token = searchParams.t;
  if (!token && !profile) notFound();
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.number },
    include: { items: { include: { review: true } }, payment: { include: { bankAccount: true, qrisAsset: true } }, invoice: true },
  }).catch(() => null);
  if (!order || (order.userId !== profile?.id && !safeTokenEqual(order.accessToken, token))) notFound();
  const qrisUrl = order.payment?.qrisAsset ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qris/${order.payment.qrisAsset.imagePath}` : undefined;
  const invoiceUrl = order.invoice ? `/api/invoice/${order.orderNumber}?t=${token ?? order.accessToken}` : undefined;
  return <><SiteHeader /><main className="order-page"><OrderStatusView order={order} token={token ?? order.accessToken} qrisUrl={qrisUrl} invoiceUrl={invoiceUrl} whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER} />{order.status === "SELESAI" && <section className="floating-panel completed-order-reviews"><h2>Bagikan pengalaman belanja</h2>{order.items.map((item) => <div key={item.id}><span>{item.productName} · {item.variantName}</span><ProductReviewLink orderItemId={item.id} review={item.review} token={token}/></div>)}</section>}</main></>;
}
