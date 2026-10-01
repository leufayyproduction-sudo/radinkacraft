import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/money";

type CardProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  minPrice: number;
  compareAtPrice: number | null;
  totalStock: number;
  ratingAvg?: number;
  ratingCount?: number;
  primaryImage: { url: string; alt: string; blendMultiply: boolean } | null;
};

export function ProductCard({ product }: { product: CardProduct }) {
  return (
    <article className="product-card">
      <Link className="catalog-image" href={`/produk/${product.slug}`}>
        {product.primaryImage ? <Image src={product.primaryImage.url} alt={product.primaryImage.alt} width={520} height={560} style={product.primaryImage.blendMultiply ? { mixBlendMode: "multiply" } : undefined} /> : <span className="image-placeholder">Bunga pilihan</span>}
      </Link>
      <div className="catalog-card-info">
        <h3><Link href={`/produk/${product.slug}`}>{product.name}</Link></h3>
        <p>{product.shortDescription}</p>
        {!!product.ratingCount && <div className="catalog-rating" aria-label={product.ratingAvg?.toFixed(1)+" dari 5 bintang"}><span>★</span> {product.ratingAvg?.toFixed(1)} <small>({product.ratingCount})</small></div>}
        <div className="stock-badges" aria-live="polite">
          {product.totalStock === 0 ? <span className="stock-badge sold-out">Habis</span> : product.totalStock < 5 ? <span className="stock-badge">Stok menipis</span> : null}
        </div>
        <div className="catalog-card-bottom">
          <div><small>Mulai dari</small><strong>{formatRupiah(product.minPrice)}</strong>{product.compareAtPrice && product.compareAtPrice > product.minPrice ? <del>{formatRupiah(product.compareAtPrice)}</del> : null}</div>
          <Link className="buy-button" href={`/produk/${product.slug}`}>Lihat produk</Link>
        </div>
      </div>
    </article>
  );
}
