import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/money";
import { updateProfileAction } from "@/app/auth-actions";
import { SiteHeader } from "@/components/site-header";
import { noindexMetadata } from "@/lib/noindex";
export const dynamic="force-dynamic";
export const metadata=noindexMetadata;
import { ProductReviewLink } from "@/components/product-review-link";

const statusLabels: Record<string, string> = { MENUNGGU_QRIS: "Menunggu QRIS", MENUNGGU_BAYAR: "Menunggu pembayaran", MENUNGGU_KONFIRMASI: "Menunggu konfirmasi", DIBAYAR: "Dibayar", DIPROSES: "Diproses", DIKIRIM: "Dikirim", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan" };
export default async function AccountPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const profile = await getCurrentProfile(); if (!profile) redirect("/masuk?next=%2Fakun");
  const orders = await prisma.order.findMany({ where: { userId: profile.id }, include: { invoice: true, items: { include: { review: true } } }, orderBy: { createdAt: "desc" }, take: 30 });
  return <><SiteHeader/><main className="account-page">
    <section className="floating-panel account-profile"><p className="eyebrow">Akun pelanggan</p><h1>Halo, {profile.name || profile.email}</h1>{searchParams.error&&<p className="form-message form-error">{searchParams.error}</p>}{searchParams.message&&<p className="form-message">{searchParams.message}</p>}<form className="auth-form" action={updateProfileAction}><label>Nama<input name="name" defaultValue={profile.name??""} required minLength={2}/></label><label>Nomor telepon<input name="phone" type="tel" defaultValue={profile.phone??""} required minLength={8}/></label><button className="buy-button" type="submit">Simpan profil</button></form></section>
    <section className="floating-panel account-orders" id="pesanan"><div className="account-section-title"><div><p className="eyebrow">Belanja bersama kami</p><h2>Riwayat pesanan</h2></div><form action="/keluar" method="post"><button className="account-signout" type="submit">Keluar</button></form></div>
      {orders.length ? <div className="account-order-list">{orders.map((order) => <div className="account-order" key={order.id}>
        <Link href={"/pesanan/"+order.orderNumber}><span><strong>{order.orderNumber}</strong><small>{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium"}).format(order.createdAt)}</small></span><span className={"order-status status-"+order.status.toLowerCase()}>{statusLabels[order.status]??order.status}</span><strong>{formatRupiah(order.total)}</strong></Link>
        {order.invoice&&<a className="secondary-button" href={"/api/invoice/"+order.orderNumber}>Unduh invoice</a>}
        {order.status==="SELESAI"&&order.items.map((item)=><div className="account-review-item" key={item.id}><span>{item.productName} · {item.variantName}</span><ProductReviewLink orderItemId={item.id} review={item.review}/></div>)}
      </div>)}</div> : <div className="account-empty"><p>Pesananmu akan tampil di sini setelah kamu memesan bunga.</p><Link href="/toko">Jelajahi toko</Link></div>}
    </section>
  </main></>;
}
