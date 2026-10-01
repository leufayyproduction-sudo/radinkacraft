"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatRupiah } from "@/lib/money";

export function CartPage() {
  const { items, subtotal, hydrated, setItems, updateQty, removeItem, setNote } = useCart();
  const [checking, setChecking] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!hydrated || !items.length || validated || checking) return;
    setChecking(true);
    fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) })
      .then(async (response) => {
        if (!response.ok) throw new Error("validation-failed");
        return response.json() as Promise<{ items: typeof items; changed: boolean }>;
      })
      .then((result) => {
        if (result.changed) {
          setItems(result.items);
          setNotice("Harga atau stok beberapa produk berubah. Keranjang sudah diperbarui sesuai data terbaru.");
        } else setItems(result.items);
        setValidated(true);
      })
      .catch(() => { setNotice("Harga dan stok belum dapat diperiksa. Hubungkan database sebelum melanjutkan."); setValidationFailed(true); setValidated(true); })
      .finally(() => setChecking(false));
  }, [checking, hydrated, items, setItems, validated]);

  const hasUnavailable = items.some((item) => item.available === false || item.qty < 1);
  const canContinue = hydrated && !checking && validated && !validationFailed && !hasUnavailable;

  if (!hydrated) return <main className="cart-page"><div className="floating-panel empty-state"><h1>Memuat keranjang</h1><p>Sebentar, kami sedang menyiapkan bunga pilihanmu.</p></div></main>;
  if (!items.length) return <main className="cart-page"><div className="floating-panel empty-state"><span aria-hidden="true">✿</span><h1>Keranjangmu masih kosong</h1><p>Temukan bunga yang pas untuk dikirimkan kepada orang tersayang.</p><Link className="buy-button" href="/toko">Jelajahi toko</Link></div></main>;

  return <main className="cart-page">
    <header className="floating-panel cart-page-head"><p className="eyebrow">Rangkaian pilihanmu</p><h1>Keranjang belanja</h1><p>Periksa pilihan bunga dan jumlahnya sebelum checkout.</p></header>
    {notice && <p className="cart-notice" role="status">{notice}</p>}
    {checking && <p className="cart-checking" role="status">Memeriksa harga dan stok terbaru…</p>}
    <div className="cart-layout"><section className="cart-items" aria-label="Produk dalam keranjang">
      {items.map((item) => <article className="floating-panel cart-row" key={item.variantId}>
        {item.image && <Image className="cart-row-image" src={item.image} alt={item.name} width={120} height={140} />}
        <div className="cart-row-main"><h2>{item.name}</h2><p>Ukuran {item.size}</p><strong>{formatRupiah(item.price)}</strong>{item.available === false && <span className="stock-badge sold-out">Stok habis</span>}<label>Catatan kartu ucapan<textarea maxLength={200} rows={2} value={item.note} onChange={(event) => setNote(item.variantId, event.target.value)} /></label></div>
        <div className="cart-row-controls"><label>Jumlah<input type="number" min="1" max={item.stock || 1} value={Math.max(item.qty, 1)} disabled={!item.stock} onChange={(event) => updateQty(item.variantId, Math.min(item.stock ?? 99, Math.max(1, Number(event.target.value) || 1)))} /></label><button type="button" onClick={() => removeItem(item.variantId)}>Hapus</button></div>
      </article>)}
    </section>
    <aside className="floating-panel cart-summary"><h2>Ringkasan</h2><div><span>Subtotal produk</span><strong>{formatRupiah(subtotal)}</strong></div><p>Ongkir dihitung saat checkout.</p><Link aria-disabled={!canContinue} className={`buy-button${canContinue ? "" : " is-disabled"}`} href={canContinue ? "/checkout" : "#keranjang"}>Lanjut ke checkout</Link><Link className="continue-shopping" href="/toko">Lanjut memilih bunga</Link></aside></div>
  </main>;
}
