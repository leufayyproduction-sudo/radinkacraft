"use client";
import Link from "next/link";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="id"><body><main className="error-page"><section className="floating-panel"><h1>Radinkacraft sedang mengalami kendala</h1><p>Muat ulang halaman atau kembali ke beranda.</p><button className="buy-button" onClick={reset}>Coba lagi</button><Link href="/">Kembali ke beranda</Link></section></main></body></html>;
}
