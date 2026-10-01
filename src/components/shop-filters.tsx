"use client";

import { useState } from "react";

type FilterCategory = { name: string; slug: string };

export function ShopFilters({ categories, values }: { categories: FilterCategory[]; values: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="filter-open-button" type="button" aria-expanded={open} onClick={() => setOpen(true)}>Atur filter</button>
    {open && <button className="filter-backdrop" aria-label="Tutup filter" onClick={() => setOpen(false)} />}
    <aside className={`shop-filters${open ? " is-open" : ""}`} aria-label="Filter produk">
      <form action="/toko" method="get" onSubmit={() => setOpen(false)}>
        <div className="filter-panel-head"><h2>Filter produk</h2><button type="button" className="filter-close" onClick={() => setOpen(false)} aria-label="Tutup filter">×</button></div>
        <label className="filter-label">Cari bunga<input type="search" name="q" placeholder="Nama atau kata kunci" defaultValue={values.q} /></label>
        <label className="filter-label">Kategori<select name="kategori" defaultValue={values.kategori}><option value="">Semua kategori</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
        <fieldset className="filter-price"><legend>Rentang harga</legend><label>Minimum (Rp)<input name="min" type="number" min="0" step="10000" placeholder="0" defaultValue={values.min} /></label><label>Maksimum (Rp)<input name="max" type="number" min="0" step="10000" placeholder="Tanpa batas" defaultValue={values.max} /></label></fieldset>
        <label className="filter-label">Ukuran bucket<select name="ukuran" defaultValue={values.ukuran}><option value="">Semua ukuran</option>{["S", "M", "L", "XL"].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
        <label className="filter-label">Urutkan<select name="urut" defaultValue={values.urut || "terbaru"}><option value="terbaru">Terbaru</option><option value="harga-rendah">Harga terendah</option><option value="harga-tinggi">Harga tertinggi</option></select></label>
        <button className="buy-button filter-submit" type="submit">Terapkan filter</button>
        <a className="filter-reset" href="/toko">Hapus semua filter</a>
      </form>
    </aside>
  </>;
}
