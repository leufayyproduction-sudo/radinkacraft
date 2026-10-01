"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { formatRupiah } from "@/lib/money";

type DetailImage = { id: string; url: string; alt: string; blendMultiply: boolean };
type DetailVariant = { id: string; name: string; price: number; compareAtPrice: number | null; stock: number };
type DetailProduct = { id: string; name: string; slug: string; description: string; shortDescription: string; category: { name: string; slug: string }; images: DetailImage[]; variants: DetailVariant[] };

export function ProductDetail({ product }: { product: DetailProduct }) {
  const router = useRouter();
  const { addItem, openDrawer } = useCart();
  const [variantId, setVariantId] = useState(product.variants.find((variant) => variant.stock > 0)?.id ?? product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [imageId, setImageId] = useState(product.images[0]?.id ?? "");
  const variant = product.variants.find((item) => item.id === variantId);
  const image = product.images.find((item) => item.id === imageId) ?? product.images[0];
  const outOfStock = !variant || variant.stock < 1;

  function addToCart(buyNow: boolean) {
    if (!variant || outOfStock) return;
    addItem({ productId: product.id, variantId: variant.id, name: product.name, size: variant.name, price: variant.price, image: image?.url ?? "", qty: Math.min(qty, variant.stock), note, stock: variant.stock, available: true });
    if (buyNow) { openDrawer(false); router.push("/keranjang"); }
  }

  return <>
    <div className="detail-layout">
      <div className="detail-gallery">
        <div className="detail-main-image floating-panel">{image ? <Image src={image.url} alt={image.alt} width={720} height={820} priority style={image.blendMultiply ? { mixBlendMode: "multiply" } : undefined} /> : <span>Bunga pilihan</span>}</div>
        {product.images.length > 1 && <div className="detail-thumbnails" aria-label="Pilih gambar produk">{product.images.map((item) => <button key={item.id} type="button" aria-label={`Lihat gambar ${item.alt}`} aria-pressed={item.id === image?.id} onClick={() => setImageId(item.id)}><Image src={item.url} alt="" width={80} height={80} /></button>)}</div>}
      </div>
      <section className="floating-panel detail-info">
        <Link className="detail-category" href={`/toko?kategori=${encodeURIComponent(product.category.slug)}`}>{product.category.name}</Link>
        <h1>{product.name}</h1><p className="detail-short">{product.shortDescription}</p>
        <div className="detail-price">{formatRupiah(variant?.price ?? 0)}{variant?.compareAtPrice && variant.compareAtPrice > variant.price ? <del>{formatRupiah(variant.compareAtPrice)}</del> : null}</div>
        <div className="detail-option"><h2>Ukuran bucket</h2><div className="sizes" role="group" aria-label="Pilih ukuran">{product.variants.map((item) => <button key={item.id} type="button" aria-pressed={item.id === variantId} aria-label={`${item.name}${item.stock === 0 ? ", habis" : ""}`} onClick={() => { setVariantId(item.id); setQty(1); }}>{item.name}</button>)}</div></div>
        <p className={`detail-stock${outOfStock ? " is-empty" : ""}`}>{outOfStock ? "Stok ukuran ini habis" : variant!.stock < 5 ? `Stok menipis · tersisa ${variant!.stock}` : `Tersedia · ${variant!.stock} bunga`}</p>
        <label className="detail-label" htmlFor="greeting-note">Catatan kartu ucapan <span>opsional</span><textarea id="greeting-note" maxLength={200} rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tuliskan pesan singkat untuk penerima" /></label>
        <div className="detail-buy-row"><label className="detail-quantity" htmlFor="product-quantity">Jumlah<input id="product-quantity" type="number" min="1" max={variant?.stock ?? 1} value={qty} disabled={outOfStock} onChange={(event) => setQty(Math.min(variant?.stock ?? 1, Math.max(1, Number(event.target.value) || 1)))} /></label><button className="buy-button" type="button" disabled={outOfStock} onClick={() => addToCart(false)}>Tambah ke keranjang</button></div>
        <button className="buy-button detail-buy-now" type="button" disabled={outOfStock} onClick={() => addToCart(true)}>Pesan sekarang</button>
        <p className="detail-description">{product.description}</p>
      </section>
    </div>
    {/* Slot ulasan produk untuk Fase 6. */}
  </>;
}
