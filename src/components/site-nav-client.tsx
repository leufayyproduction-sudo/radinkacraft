"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { NavItem } from "@/lib/site-settings";
export function SiteNavClient({ items, brand, logoUrl }: { items: NavItem[]; brand: string; logoUrl: string }) {
  const [menuOpen,setMenuOpen]=useState(false);const {itemCount}=useCart();const [user,setUser]=useState<{name:string|null;email:string}|null>(null);
  useEffect(()=>{void fetch("/api/auth/profile").then(r=>r.json()).then(setUser).catch(()=>setUser(null));},[]);
  return <nav className="site-nav" aria-label="Menu utama"><a className="brand" href="/" aria-label="Radinkacraft, beranda">{logoUrl?<Image src={logoUrl} alt="" width={38} height={38}/>:<span className="brand-drop" aria-hidden="true"/>}{brand}</a><div className={`nav-links${menuOpen?" is-open":""}`}>{items.map(item=><a href={item.href} key={`${item.label}-${item.href}`} onClick={()=>setMenuOpen(false)}>{item.label}</a>)}<div className="auth-nav">{user?<><a href="/akun">{user.name||"Akun"}</a><a href="/akun#pesanan">Pesanan</a><form action="/keluar" method="post"><button type="submit">Keluar</button></form></>:<><a href="/masuk">Masuk</a><a href="/daftar">Daftar</a></>}</div></div><a className="cart-link" href="/keranjang" aria-label={`Lihat keranjang${itemCount?`, ${itemCount} item`:""}`}><span className="cart-icon" aria-hidden="true"><i>{itemCount>0?itemCount:""}</i></span></a><button className="menu-toggle" aria-label={menuOpen?"Tutup menu":"Buka menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><span/><span/><span/></button></nav>;
}
