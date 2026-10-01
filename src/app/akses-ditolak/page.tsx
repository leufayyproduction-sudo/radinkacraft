import Link from "next/link";

export default function AccessDeniedPage() {
  return <main className="admin-auth-error floating-panel"><p className="eyebrow">Akses dibatasi</p><h1>403 · Halaman ini khusus admin</h1><p>Akunmu tidak memiliki izin untuk membuka halaman tersebut.</p><Link className="buy-button" href="/">Kembali ke beranda</Link></main>;
}
