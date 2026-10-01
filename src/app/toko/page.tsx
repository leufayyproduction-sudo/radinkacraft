import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { ShopFilters } from "@/components/shop-filters";
import { homepageContent } from "@/data/homepage";
import { getCategories, listProducts } from "@/lib/products";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;
const value = (params: SearchParams, key: string) => typeof params[key] === "string" ? params[key] as string : "";
export const revalidate=60;
export async function generateMetadata({searchParams}:{searchParams:SearchParams}):Promise<Metadata>{const filtered=Object.values(searchParams).some(value=>Array.isArray(value)?value.length>0:Boolean(value));return buildMetadata({title:"Toko bunga",description:"Jelajahi bucket bunga dan rangkaian pilihan radinkacraft.",path:"/toko",noindex:filtered});}

function pageUrl(params: SearchParams, nextPage: number) {
  const search = new URLSearchParams();
  for (const key of ["kategori", "q", "min", "max", "ukuran", "urut"]) {
    const current = value(params, key);
    if (current) search.set(key, current);
  }
  search.set("page", String(nextPage));
  return `/toko?${search.toString()}`;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = { kategori: value(searchParams, "kategori"), q: value(searchParams, "q"), min: value(searchParams, "min"), max: value(searchParams, "max"), ukuran: value(searchParams, "ukuran"), urut: value(searchParams, "urut"), page: value(searchParams, "page"), pageSize: 12 };
  const [categories, result] = await Promise.all([
    getCategories().catch(() => homepageContent.categories.map((name) => ({ name, slug: name.toLowerCase().replaceAll(" ", "-") }))),
    listProducts(filters).catch(() => ({ items: [], total: 0, page: Math.max(1, Number(filters.page) || 1), pageSize: 12, pageCount: 1 })),
  ]);
  const activeFilters = Object.fromEntries(["kategori", "q", "min", "max", "ukuran", "urut"].map((key) => [key, value(searchParams, key)]));

  return <main className="shop-page"><SiteHeader />
    <header className="floating-panel shop-hero"><p className="eyebrow">Rangkaian bunga Radinkacraft</p><h1>Temukan bunga untuk ceritamu</h1><p>Pilih buket yang paling pas untuk momen istimewa.</p></header>
    <div className="shop-layout"><ShopFilters categories={categories} values={activeFilters} />
      <section className="shop-results" aria-label="Daftar produk">
        <div className="shop-results-head"><p>{result.total} rangkaian bunga</p><p className="shop-sort-note">Dibuat segar dengan penuh perhatian</p></div>
        {result.items.length ? <div className="shop-grid">{result.items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="floating-panel empty-state"><span aria-hidden="true">✿</span><h2>Belum ada bunga yang cocok</h2><p>Coba ubah kata pencarian atau atur kembali filternya.</p><Link className="buy-button" href="/toko">Lihat semua rangkaian</Link></div>}
        {result.pageCount > 1 && <nav className="pagination" aria-label="Paginasi produk">{result.page > 1 && <Link href={pageUrl(searchParams, result.page - 1)}>Sebelumnya</Link>}<span>Halaman {result.page} dari {result.pageCount}</span>{result.page < result.pageCount && <Link href={pageUrl(searchParams, result.page + 1)}>Berikutnya</Link>}</nav>}
      </section>
    </div>
  </main>;
}
