"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/money";
import { ProofUploader } from "@/components/proof-uploader";
import { switchOrderToBank } from "@/app/checkout/actions";

type OrderData = {
  orderNumber: string; accessToken: string; status: string; total: number; subtotal: number; shippingFee: number; shippingZone: string;
  customerName: string; recipientName: string; recipientPhone: string; address: string; city: string; postalCode: string | null;
  deliveryDate: Date; deliverySlot: string; cardMessage: string | null; expiresAt: Date; paymentMethod: string;
  items: Array<{ id: string; productName: string; variantName: string; price: number; qty: number; imageUrl: string; cardNote: string | null }>;
  payment: { status: string; method: string; proofPath: string | null; rejectReason: string | null; bankAccount: { bankName: string; accountNumber: string; accountHolder: string; logoUrl: string | null } | null; qrisAsset: { imagePath: string; label: string | null } | null } | null;
};

const statusLabels: Record<string, string> = { MENUNGGU_QRIS: "Menyiapkan QRIS", MENUNGGU_BAYAR: "Menunggu pembayaran", MENUNGGU_KONFIRMASI: "Menunggu konfirmasi", DIBAYAR: "Dibayar", DIPROSES: "Diproses", DIKIRIM: "Dikirim", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan" };
const steps = ["MENUNGGU_BAYAR", "DIBAYAR", "DIPROSES", "DIKIRIM", "SELESAI"];

export function OrderStatusView({ order, token, qrisUrl, invoiceUrl, whatsapp }: { order: OrderData; token?: string; qrisUrl?: string; invoiceUrl?: string; whatsapp?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)));
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  const canSwitch = ["MENUNGGU_QRIS", "MENUNGGU_BAYAR"].includes(status) && order.payment?.status !== "SUBMITTED";
  const waitingQris = status === "MENUNGGU_QRIS";
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [order.expiresAt]);
  useEffect(() => {
    if (!waitingQris || !token) return;
    const timer = window.setInterval(() => { void fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/status?t=${encodeURIComponent(token)}`).then((response) => response.ok ? response.json() : null).then((result) => { if (result?.status && result.status !== status) { setStatus(result.status); router.refresh(); } }).catch(() => undefined); }, 5000);
    return () => window.clearInterval(timer);
  }, [order.orderNumber, router, status, token, waitingQris]);
  function switchBank() {
    startTransition(async () => { try { await switchOrderToBank(order.orderNumber, token); setStatus("MENUNGGU_BAYAR"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Metode pembayaran belum dapat diganti."); } });
  }
  const remaining = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const stepIndex = steps.indexOf(status);
  const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return <>
    <section className="floating-panel order-payment"><div className="order-topline"><span className={`order-status status-${status.toLowerCase()}`}>{statusLabels[status] ?? status}</span><span className="order-number">{order.orderNumber}</span></div>
      <h1>{waitingQris ? "QRIS sedang disiapkan" : status === "MENUNGGU_KONFIRMASI" ? "Bukti pembayaran diterima" : "Pesananmu sudah dibuat"}</h1>
      {invoiceUrl && ["DIBAYAR","DIPROSES","DIKIRIM","SELESAI"].includes(status) && <a className="buy-button" href={invoiceUrl}>Unduh invoice</a>}
      {waitingQris ? <p>Admin akan menyiapkan QRIS untuk total {formatRupiah(order.total)}. Halaman pesanan akan otomatis diperbarui.</p> : status === "MENUNGGU_KONFIRMASI" ? <p>Bukti diterima, admin akan mengonfirmasi pembayaran.</p> : <p>Silakan selesaikan pembayaran sebelum batas waktu.</p>}
      {!["DIBAYAR", "DIPROSES", "DIKIRIM", "SELESAI", "DIBATALKAN"].includes(status) && <div className="order-countdown"><span>Batas pembayaran</span><strong>{seconds > 0 ? remaining : "Waktu pembayaran berakhir"}</strong></div>}
      {status === "MENUNGGU_BAYAR" && order.paymentMethod === "BANK" && order.payment?.bankAccount && <div className="order-bank"><p>Transfer tepat <strong>{formatRupiah(order.total)}</strong> ke rekening berikut.</p><div>{order.payment.bankAccount.logoUrl && <Image src={order.payment.bankAccount.logoUrl} alt={`Logo ${order.payment.bankAccount.bankName}`} width={42} height={42} />}<span><b>{order.payment.bankAccount.bankName}</b><strong>{order.payment.bankAccount.accountNumber}</strong><small>a.n. {order.payment.bankAccount.accountHolder}</small></span><button type="button" className="copy-button" onClick={() => void navigator.clipboard.writeText(order.payment!.bankAccount!.accountNumber)}>Salin nomor</button></div><p className="copy-total">Total: <strong>{formatRupiah(order.total)}</strong><button className="copy-button" type="button" onClick={() => void navigator.clipboard.writeText(String(order.total))}>Salin total</button></p></div>}
      {status === "MENUNGGU_BAYAR" && order.paymentMethod === "QRIS" && order.payment?.qrisAsset && qrisUrl && <div className="order-qris"><h2>Bayar tepat {formatRupiah(order.total)}</h2><Image src={qrisUrl} alt={order.payment.qrisAsset.label || "Kode QRIS Dana"} width={320} height={320} /><a className="secondary-button" href={qrisUrl} download>Unduh QRIS</a></div>}
      {waitingQris && canSwitch && <p>Jika ingin melanjutkan sekarang, kamu bisa memilih transfer bank.</p>}
      {canSwitch && order.paymentMethod === "QRIS" && <button type="button" className="secondary-button" disabled={busy} onClick={switchBank}>Ganti ke Transfer Bank</button>}
      {message && <p className="form-message form-error">{message}</p>}
      {!["MENUNGGU_QRIS", "DIBAYAR", "DIPROSES", "DIKIRIM", "SELESAI", "DIBATALKAN"].includes(status) && <div className="order-proof"><h2>{order.payment?.status === "SUBMITTED" ? "Bukti sedang diperiksa" : "Unggah bukti pembayaran"}</h2>{order.payment?.status === "SUBMITTED" ? <p>Bukti diterima, admin akan mengonfirmasi pembayaran.</p> : <>{order.payment?.rejectReason && <p className="form-message form-error">Bukti sebelumnya ditolak: {order.payment.rejectReason}</p>}<ProofUploader orderNumber={order.orderNumber} token={token} onUploaded={() => { setStatus("MENUNGGU_KONFIRMASI"); router.refresh(); }} compact /></>}</div>}
      {whatsapp && <a className="buy-button order-whatsapp" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Halo Radinkacraft, saya ingin menanyakan pesanan ${order.orderNumber}.` )}`} target="_blank" rel="noreferrer">Hubungi admin via WhatsApp</a>}
    </section>
    {stepIndex >= 0 && <section className="floating-panel order-stepper" aria-label="Tahapan pesanan">{steps.map((step, index) => <div className={index <= stepIndex ? "is-done" : ""} key={step}><i>{index + 1}</i><span>{statusLabels[step]}</span></div>)}</section>}
    <section className="order-info-grid"><div className="floating-panel order-items"><h2>Ringkasan pesanan</h2>{order.items.map((item) => <article key={item.id}>{item.imageUrl && <Image src={item.imageUrl} alt={item.productName} width={60} height={68} />}<span><strong>{item.productName}</strong><small>{item.variantName} · {item.qty} buah</small>{item.cardNote && <small>Pesan kartu: {item.cardNote}</small>}</span><b>{formatRupiah(item.price * item.qty)}</b></article>)}<div className="summary-line"><span>Subtotal</span><strong>{formatRupiah(order.subtotal)}</strong></div><div className="summary-line"><span>Ongkir</span><strong>{formatRupiah(order.shippingFee)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatRupiah(order.total)}</strong></div></div><div className="floating-panel delivery-card"><h2>Jadwal dan alamat kirim</h2><p><strong>{order.recipientName}</strong><br />{order.recipientPhone}</p><p>{order.address}<br />{order.city}{order.postalCode ? `, ${order.postalCode}` : ""}</p><p>{new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date(order.deliveryDate))} · {order.deliverySlot.toLowerCase()}</p>{order.cardMessage && <p>Pesan kartu: {order.cardMessage}</p>}<p>Zona: {order.shippingZone}</p></div></section>
  </>;
}
