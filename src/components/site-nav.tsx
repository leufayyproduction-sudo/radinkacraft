"use client";

import { useState } from "react";
import { homepageContent } from "@/data/homepage";
import { useCart } from "@/components/cart-provider";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <nav className="site-nav" aria-label="Menu utama">
      <a className="brand" href="/" aria-label="Radinkacraft, beranda">
        <span className="brand-drop" aria-hidden="true" />{homepageContent.brand}
      </a>
      <div className={`nav-links${menuOpen ? " is-open" : ""}`}>
        {homepageContent.navigation.map((item) => <a href={item.href} key={item.label} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
      </div>
      <a className="cart-link" href="/keranjang" aria-label={`Lihat keranjang${itemCount ? `, ${itemCount} item` : ""}`}><span className="cart-icon" aria-hidden="true"><i>{itemCount > 0 ? itemCount : ""}</i></span></a>
      <button className="menu-toggle" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span /><span />
      </button>
    </nav>
  );
}
