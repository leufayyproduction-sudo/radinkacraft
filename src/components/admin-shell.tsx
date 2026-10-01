"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const items = [["Dashboard", "/admin"], ["Produk", "/admin/produk"], ["Kategori", "/admin/kategori"], ["Media", "/admin/media"], ["Halaman", "/admin/halaman"], ["Blog", "/admin/blog"], ["Pesanan", "/admin/pesanan"], ["Pembayaran", "/admin/pembayaran"], ["Rekening bank", "/admin/rekening"], ["Pustaka QRIS", "/admin/qris"], ["Ulasan produk", "/admin/ulasan"], ["SEO", "/admin/seo"], ["Pengaturan", "/admin/pengaturan"], ["Pengaturan situs", "/admin/pengaturan/situs"], ["Hero", "/admin/hero"], ["Testimoni toko", "/admin/testimoni"]] as const;
export function AdminShell({ children, name, orderCount, reviewCount, paymentCount = 0, testimonialCount = 0 }: { children: React.ReactNode; name: string; orderCount: number; reviewCount: number; paymentCount?: number; testimonialCount?: number }) {
  const path = usePathname(); const search = useSearchParams(); const [open, setOpen] = useState(false); const [toast,setToast]=useState("");
  useEffect(()=>{const text=search.get("success")||search.get("error");if(text){setToast(text);const timeout=window.setTimeout(()=>setToast(""),4500);return()=>window.clearTimeout(timeout);}},[path,search]);
  return <div className="admin-shell">
    {open && <button className="admin-backdrop" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
    <aside className={`admin-sidebar${open ? " admin-sidebar-open" : ""}`}><Link href="/admin" className="admin-brand">radinkacraft<span>Admin</span></Link><nav>{items.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? "active" : ""}>{label}{href === "/admin/pesanan" && orderCount > 0 && <b>{orderCount}</b>}{href === "/admin/pembayaran" && paymentCount > 0 && <b>{paymentCount}</b>}{href === "/admin/ulasan" && reviewCount > 0 && <b>{reviewCount}</b>}{href === "/admin/testimoni" && testimonialCount > 0 && <b>{testimonialCount}</b>}</Link>)}</nav><Link href="/" className="admin-public-link">Lihat situs ↗</Link></aside>
    <section className="admin-main"><header className="admin-topbar"><button className="admin-menu-toggle" aria-label="Buka menu" onClick={() => setOpen(true)}>☰</button><span>Panel pengelola</span><div><span>{name}</span><form action="/keluar" method="post"><button className="secondary-button">Keluar</button></form></div></header>{toast&&<div className="admin-toast" role="status">{toast}<button type="button" onClick={()=>setToast("")} aria-label="Tutup notifikasi">×</button></div>}<main className="admin-content">{children}</main></section>
  </div>;
}
