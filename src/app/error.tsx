"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><section className="floating-panel"><p className="eyebrow">Terjadi kendala</p><h1>Halaman belum dapat dimuat</h1><p>Coba muat ulang. Jika masalah berlanjut, kembali ke beranda.</p><button className="buy-button" onClick={reset}>Coba lagi</button><Link href="/">Kembali ke beranda</Link></section></main>;
}
