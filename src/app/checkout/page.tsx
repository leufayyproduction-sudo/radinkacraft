import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { noindexMetadata } from "@/lib/noindex";
export const dynamic="force-dynamic";
export const metadata=noindexMetadata;

export default async function CheckoutPage() {
  const [profile, shipping, banks, qrisAssets] = await Promise.all([
    getCurrentProfile().catch(() => null),
    prisma.setting.findUnique({ where: { key: "shipping" } }).catch(() => null),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.qrisAsset.findMany({ where: { isActive: true } }).catch(() => []),
  ]);
  const zones = Array.isArray(shipping?.value) ? shipping.value as Array<{ name: string; fee: number }> : [];
  if (zones.length === 0) redirect("/keranjang?error=Pengaturan%20pengiriman%20belum%20tersedia.");
  return <><SiteHeader /><main className="checkout-page"><header className="floating-panel cart-page-head"><p className="eyebrow">Terima kasih memilih Radinkacraft</p><h1>Checkout</h1><p>Isi detail pengiriman, lalu pilih cara pembayaran.</p></header><CheckoutForm banks={banks} zones={zones} profile={profile} qrisAssets={qrisAssets} /></main></>;
}
