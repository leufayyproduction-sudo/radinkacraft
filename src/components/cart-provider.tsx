"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatRupiah } from "@/lib/money";
import type { CartItem } from "@/lib/cart-types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  drawerOpen: boolean;
  addItem: (item: CartItem) => void;
  setItems: (items: CartItem[]) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  setNote: (variantId: string, note: string) => void;
  openDrawer: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "radinkacraft-cart-v1";

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart harus digunakan di dalam CartProvider");
  return value;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setItemsState(parsed.filter((item) => item && typeof item.variantId === "string" && typeof item.qty === "number"));
    } catch {
      setItemsState([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Penyimpanan lokal bisa tidak tersedia. */ }
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    hydrated,
    drawerOpen,
    addItem(item) {
      setItemsState((current) => {
        const existing = current.find((row) => row.variantId === item.variantId);
        return existing ? current.map((row) => row.variantId === item.variantId ? { ...row, qty: row.qty + item.qty, note: item.note || row.note } : row) : [...current, item];
      });
      setDrawerOpen(true);
    },
    setItems: setItemsState,
    updateQty(variantId, qty) { setItemsState((current) => current.map((item) => item.variantId === variantId ? { ...item, qty: Math.max(1, Math.floor(qty) || 1) } : item)); },
    removeItem(variantId) { setItemsState((current) => current.filter((item) => item.variantId !== variantId)); },
    setNote(variantId, note) { setItemsState((current) => current.map((item) => item.variantId === variantId ? { ...item, note: note.slice(0, 200) } : item)); },
    openDrawer: setDrawerOpen,
  }), [drawerOpen, hydrated, items]);

  return <CartContext.Provider value={value}>{children}<CartDrawer /></CartContext.Provider>;
}

function CartDrawer() {
  const { items, subtotal, drawerOpen, openDrawer } = useCart();
  if (!drawerOpen) return null;
  const latest = items.at(-1);
  return <div className="cart-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) openDrawer(false); }}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <div className="cart-drawer-head"><h2 id="cart-drawer-title">Ditambahkan ke keranjang</h2><button type="button" onClick={() => openDrawer(false)} aria-label="Tutup keranjang">×</button></div>
      {latest && <div className="drawer-latest">{latest.image && <Image src={latest.image} alt={latest.name} width={72} height={84} />}<div><strong>{latest.name}</strong><span>Ukuran {latest.size} · {latest.qty} buah</span><b>{formatRupiah(latest.price)}</b></div></div>}
      <div className="drawer-total"><span>Subtotal keranjang</span><strong>{formatRupiah(subtotal)}</strong></div>
      <Link className="buy-button drawer-cart-button" href="/keranjang" onClick={() => openDrawer(false)}>Lihat keranjang</Link>
      <button className="drawer-continue" type="button" onClick={() => openDrawer(false)}>Lanjut memilih bunga</button>
    </aside>
  </div>;
}
