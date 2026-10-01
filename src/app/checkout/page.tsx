import Link from "next/link";

export default function CheckoutPlaceholder() {
  return <main className="cart-page"><section className="floating-panel empty-state"><p className="eyebrow">Satu langkah lagi</p><h1>Checkout segera hadir</h1><p>Alur checkout dan pembayaran akan tersedia pada fase berikutnya. Pilihanmu tersimpan di keranjang.</p><Link className="buy-button" href="/keranjang">Kembali ke keranjang</Link></section></main>;
}
