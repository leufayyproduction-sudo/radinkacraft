"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { formatRupiah } from "@/lib/money";
import { createOrderAction, type CheckoutState } from "@/app/checkout/actions";

const schema = z.object({ customerName: z.string().trim().min(2, "Nama pemesan minimal 2 karakter."), customerEmail: z.string().email("Email tidak valid."), customerPhone: z.string().regex(/^(\+?62|0)8[0-9\s-]{7,13}$/, "Gunakan nomor telepon Indonesia yang valid."), recipientName: z.string().trim().min(2, "Nama penerima minimal 2 karakter."), recipientPhone: z.string().regex(/^(\+?62|0)8[0-9\s-]{7,13}$/, "Nomor penerima tidak valid."), address: z.string().trim().min(8, "Alamat minimal 8 karakter."), city: z.string().trim().min(2, "Kota wajib diisi."), postalCode: z.string().optional(), shippingZone: z.string().min(1, "Pilih zona pengiriman."), deliveryDate: z.string().min(1, "Pilih tanggal pengiriman."), deliverySlot: z.enum(["PAGI", "SIANG", "SORE"], { message: "Pilih waktu pengiriman." }), cardMessage: z.string().max(200), notes: z.string().max(1000), paymentMethod: z.enum(["BANK", "QRIS"], { message: "Pilih metode pembayaran." }) });
type FormValues = z.infer<typeof schema>;
type Bank = { id: string; bankName: string; accountNumber: string; accountHolder: string; logoUrl: string | null };
type Zone = { name: string; fee: number };
type Qris = { amount: number; imagePath: string; label: string | null };

const indonesiaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

export function CheckoutForm({ banks, zones, profile, qrisAssets }: { banks: Bank[]; zones: Zone[]; profile: { name?: string | null; email: string; phone?: string | null } | null; qrisAssets: Qris[] }) {
  const router = useRouter();
  const { items, subtotal, hydrated, setItems } = useCart();
  const [state, setState] = useState<CheckoutState>({});
  const [proof, setProof] = useState<File | null>(null);
  const [working, startTransition] = useTransition();
  const [secureMessage, setSecureMessage] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { customerName: profile?.name ?? "", customerEmail: profile?.email ?? "", customerPhone: profile?.phone ?? "", recipientName: "", recipientPhone: "", address: "", city: "", postalCode: "", shippingZone: "", deliveryDate: "", deliverySlot: undefined, cardMessage: "", notes: "", paymentMethod: undefined } });
  const method = form.watch("paymentMethod");
  const selectedZone = zones.find((zone) => zone.name === form.watch("shippingZone"));
  const total = subtotal + (selectedZone?.fee ?? 0);
  const qris = qrisAssets.find((asset) => asset.amount === total);
  const today = useMemo(indonesiaToday, []);
  const maxDate = useMemo(() => { const date = new Date(`${today}T00:00:00+07:00`); date.setDate(date.getDate() + 60); return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date); }, [today]);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }).then(async (response) => {
      if (!response.ok) throw new Error("failed");
      const result = await response.json() as { items: typeof items; changed: boolean };
      setItems(result.items);
      if (result.changed) setState({ error: "Harga atau stok berubah. Ringkasan telah diperbarui, silakan periksa sebelum membuat pesanan." });
    }).catch(() => setState({ error: "Harga dan stok belum dapat diperiksa. Coba lagi setelah koneksi tersedia." }));
  // Periksa isi keranjang satu kali saat checkout dibuka.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function submit(values: FormValues) {
    if (!items.length) { setState({ error: "Keranjangmu kosong." }); return; }
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) data.set(key, value ?? "");
    data.set("cart", JSON.stringify(items.map(({ variantId, qty, note }) => ({ variantId, qty, note }))));
    if (proof) { data.set("hasProof", "true"); data.set("proofName", proof.name); data.set("proofType", proof.type); data.set("proofSize", String(proof.size)); }
    startTransition(async () => {
      const result = await createOrderAction(state, data);
      if (result.upload) {
        const { orderNumber, token, path, uploadToken, type } = result.upload;
        setItems([]);
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const uploaded = await createClient().storage.from("payment-proofs").uploadToSignedUrl(path, uploadToken, proof!, { contentType: type });
          if (uploaded.error) throw uploaded.error;
          const { confirmProofUploaded } = await import("@/app/checkout/actions");
          await confirmProofUploaded(orderNumber, token, path);
          router.push(`/pesanan/${orderNumber}?t=${token}`);
        } catch { setSecureMessage("Pesanan sudah dibuat. Bukti belum terkirim; unggah kembali dari halaman pesanan."); router.push(`/pesanan/${orderNumber}?t=${token}`); }
        return;
      }
      setState(result);
      if (!result.error) setItems([]);
    });
  }

  if (!hydrated) return <p className="cart-checking">Menyiapkan keranjang…</p>;
  if (!items.length) return <section className="floating-panel empty-state"><h1>Keranjangmu kosong</h1><p>Pilih bunga terlebih dahulu sebelum checkout.</p><Link className="buy-button" href="/toko">Jelajahi toko</Link></section>;
  const fieldError = (name: keyof FormValues) => form.formState.errors[name]?.message;
  return <form className="checkout-layout" onSubmit={form.handleSubmit(submit)} noValidate>
    <div className="checkout-fields">
      <section className="floating-panel checkout-section"><p className="eyebrow">Informasi pemesan</p><h2>Kontakmu</h2><div className="checkout-form-grid"><label>Nama pemesan<input {...form.register("customerName")} autoComplete="name" />{fieldError("customerName") && <small>{fieldError("customerName")}</small>}</label><label>Email<input {...form.register("customerEmail")} type="email" autoComplete="email" />{fieldError("customerEmail") && <small>{fieldError("customerEmail")}</small>}</label><label>Nomor telepon<input {...form.register("customerPhone")} type="tel" autoComplete="tel" />{fieldError("customerPhone") && <small>{fieldError("customerPhone")}</small>}</label></div></section>
      <section className="floating-panel checkout-section"><p className="eyebrow">Pengiriman bunga</p><h2>Detail penerima</h2><div className="checkout-form-grid"><label>Nama penerima<input {...form.register("recipientName")} />{fieldError("recipientName") && <small>{fieldError("recipientName")}</small>}</label><label>Telepon penerima<input {...form.register("recipientPhone")} type="tel" />{fieldError("recipientPhone") && <small>{fieldError("recipientPhone")}</small>}</label><label className="field-wide">Alamat lengkap<textarea {...form.register("address")} rows={3} />{fieldError("address") && <small>{fieldError("address")}</small>}</label><label>Kota<input {...form.register("city")} />{fieldError("city") && <small>{fieldError("city")}</small>}</label><label>Kode pos<input {...form.register("postalCode")} inputMode="numeric" /></label><label>Zona pengiriman<select {...form.register("shippingZone")}><option value="">Pilih zona</option>{zones.map((zone) => <option value={zone.name} key={zone.name}>{zone.name} · {formatRupiah(zone.fee)}</option>)}</select>{fieldError("shippingZone") && <small>{fieldError("shippingZone")}</small>}</label><label>Tanggal kirim<input {...form.register("deliveryDate")} type="date" min={today} max={maxDate} />{fieldError("deliveryDate") && <small>{fieldError("deliveryDate")}</small>}</label><label>Waktu kirim<select {...form.register("deliverySlot")}><option value="">Pilih waktu</option><option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="SORE">Sore</option></select>{fieldError("deliverySlot") && <small>{fieldError("deliverySlot")}</small>}</label><label className="field-wide">Pesan di kartu ucapan <span>(opsional)</span><textarea {...form.register("cardMessage")} maxLength={200} rows={2} placeholder="Untuk siapa dan pesan darimu" /></label><label className="field-wide">Catatan pengiriman <span>(opsional)</span><textarea {...form.register("notes")} rows={2} placeholder="Petunjuk tambahan untuk kurir" /></label></div></section>
      <section className="floating-panel checkout-section"><p className="eyebrow">Pilih cara pembayaran</p><h2>Metode pembayaran</h2><div className="payment-methods"><label className={method === "BANK" ? "selected" : ""}><input type="radio" value="BANK" {...form.register("paymentMethod")} /><span className="payment-method-icon">▤</span><strong>Transfer Bank</strong><small>Bayar lewat rekening bank</small></label><label className={method === "QRIS" ? "selected" : ""}><input type="radio" value="QRIS" {...form.register("paymentMethod")} /><span className="payment-method-icon">▦</span><strong>QRIS Dana</strong><small>Bayar dengan QRIS sesuai total</small></label></div>{fieldError("paymentMethod") && <small className="field-error">{fieldError("paymentMethod")}</small>}
        {method === "BANK" && <div className="payment-instructions"><h3>Rekening tujuan</h3>{banks.length ? banks.map((bank) => <div className="checkout-bank" key={bank.id}>{bank.logoUrl && <Image src={bank.logoUrl} alt={`Logo ${bank.bankName}`} width={36} height={36} />}<span><strong>{bank.bankName}</strong><small>{bank.accountNumber} · a.n. {bank.accountHolder}</small></span><button type="button" className="copy-button" onClick={() => void navigator.clipboard.writeText(bank.accountNumber)}>Salin nomor</button></div>) : <p>Rekening transfer belum tersedia. Silakan hubungi Radinkacraft.</p>}<p className="copy-total">Total yang dibayar: <strong>{formatRupiah(total)}</strong><button type="button" className="copy-button" onClick={() => void navigator.clipboard.writeText(String(total))}>Salin total</button></p><ProofPicker file={proof} onSelect={setProof} /></div>}
        {method === "QRIS" && <div className="payment-instructions">{qris ? <><h3>Bayar tepat {formatRupiah(total)}</h3><Image className="checkout-qris" src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qris/${qris.imagePath}`} alt={qris.label || "Kode QRIS Dana untuk pembayaran"} width={320} height={320} /><a className="secondary-button" href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qris/${qris.imagePath}`} download>Unduh QRIS</a><ProofPicker file={proof} onSelect={setProof} /></> : <p>Admin akan menyiapkan QRIS untuk total {formatRupiah(total)}. Halaman pesanan akan otomatis diperbarui.</p>}<button className="secondary-button" type="button" onClick={() => form.setValue("paymentMethod", "BANK", { shouldValidate: true })}>Ganti ke Transfer Bank</button></div>}</section>
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}{secureMessage && <p className="form-message form-error" role="status">{secureMessage}</p>}
    </div>
    <aside className="floating-panel checkout-summary"><p className="eyebrow">Pesananmu</p><h2>Ringkasan belanja</h2>{items.map((item) => <div className="checkout-item" key={item.variantId}>{item.image && <Image src={item.image} alt={item.name} width={56} height={64} />}<span><strong>{item.name}</strong><small>{item.size} · {item.qty} buah</small></span><b>{formatRupiah(item.price * item.qty)}</b></div>)}<div className="summary-line"><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div className="summary-line"><span>Ongkir</span><strong>{formatRupiah(selectedZone?.fee ?? 0)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatRupiah(total)}</strong></div><button className="buy-button" type="submit" disabled={working || !method}>{working ? "Membuat pesanan…" : "Buat pesanan"}</button><small className="secure-note">Total pembayaran QRIS sama persis dengan tagihan.</small></aside>
  </form>;
}

function ProofPicker({ file, onSelect }: { file: File | null; onSelect: (file: File | null) => void }) {
  return <label className="checkout-proof">Bukti pembayaran <span>(opsional, bisa menyusul)</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={(event) => { const selected = event.target.files?.[0]; if (!selected) return; if (!selected.type.startsWith("image/")) { onSelect(selected); return; } void imageCompression(selected, { maxSizeMB: 4.8, maxWidthOrHeight: 2400, useWebWorker: true, fileType: "image/webp" }).then((compressed) => onSelect(new File([compressed], "payment-proof.webp", { type: "image/webp" }))).catch(() => onSelect(selected)); }} /><small>{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "Pilih JPG, PNG, WebP, atau PDF maksimal 5 MB"}</small></label>;
}
