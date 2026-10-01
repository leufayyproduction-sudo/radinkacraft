import Link from "next/link";
import { relativeIndonesianDate } from "@/lib/testimonials";

export type TestimonialItem = { id: string; name: string; message: string; rating: number; isVerifiedBuyer: boolean; createdAt: Date };
export function TestimonialCard({ item }: { item: TestimonialItem }) {
  return <article className="testimonial-card"><div className="testimonial-stars" aria-label={`${item.rating} dari 5 bintang`}>{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</div><p>{item.message}</p><div className="testimonial-byline"><strong>{item.name}</strong><time>{relativeIndonesianDate(item.createdAt)}{item.isVerifiedBuyer&&<span className="verified-label">Pembeli terverifikasi</span>}</time></div></article>;
}
export function TestimonialMarquee({ items }: { items: TestimonialItem[] }) {
  const repeated = items.length ? Array.from({length: Math.max(2, Math.ceil(8/items.length))},()=>items).flat() : [];
  if (!items.length) return <div className="testimonial-empty">Belum ada ulasan. Jadilah yang pertama berbagi pengalaman.</div>;
  return <div className="testimonial-marquee" role="region" aria-label="Ulasan pelanggan"><div className="testimonial-track">{[...repeated,...repeated].map((item,index)=><TestimonialCard key={`${item.id}-${index}`} item={item}/>)}</div></div>;
}
export function AllTestimonials({ items }: { items: TestimonialItem[] }) { return <div className="testimonial-grid">{items.map((item)=><TestimonialCard key={item.id} item={item}/>)}</div>; }
export function TestimonialPagination({ page, pageCount }: { page:number; pageCount:number }) { if(pageCount<2)return null;return <nav className="testimonial-pagination" aria-label="Halaman ulasan">{page>1?<Link href={`/ulasan?page=${page-1}`}>← Sebelumnya</Link>:<span/>}<span>Halaman {page} dari {pageCount}</span>{page<pageCount?<Link href={`/ulasan?page=${page+1}`}>Berikutnya →</Link>:<span/>}</nav>; }
