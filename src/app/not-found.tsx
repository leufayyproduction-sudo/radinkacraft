import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><section className="floating-panel"><p className="eyebrow">Halaman tidak ditemukan</p><h1>Sepertinya halaman ini belum tersedia</h1><p>Periksa alamatnya atau kembali untuk melihat rangkaian bunga kami.</p><Link className="buy-button" href="/">Kembali ke beranda</Link></section></main>;
}
