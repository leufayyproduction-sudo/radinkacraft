import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TestimonialForm } from "@/components/testimonial-form";
import { AllTestimonials, TestimonialPagination } from "@/components/testimonial-display";
import { getCurrentProfile } from "@/lib/auth";
import { getTestimonialPage } from "@/lib/testimonials";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const revalidate=60;
export async function generateMetadata():Promise<Metadata>{return buildMetadata({title:"Ulasan pelanggan",description:"Cerita dan pengalaman pelanggan radinkacraft.",path:"/ulasan"});}

export default async function TestimonialsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.min(10000, Math.max(1, Number(searchParams.page) || 1));
  const [result, profile] = await Promise.all([getTestimonialPage(page).catch(()=>({items:[],total:0,page,pageCount:1,average:0})),getCurrentProfile().catch(()=>null)]);
  return <main className="testimonials-page"><SiteHeader/><nav className="breadcrumbs" aria-label="Navigasi halaman"><Link href="/">Beranda</Link><span>/</span><span>Ulasan</span></nav><header className="floating-panel testimonials-summary"><p className="eyebrow">Cerita dari pelanggan</p><h1>Ulasan pelanggan</h1><div><strong>{result.average.toFixed(1)}</strong><span aria-label="5 bintang">★★★★★</span><small>{result.total} ulasan</small></div></header><section className="floating-panel testimonial-form-wrap"><h2>Tulis ulasanmu</h2><p>Bagikan pengalamanmu agar pelanggan lain dapat memilih dengan nyaman.</p><TestimonialForm initialName={profile?.name??""}/></section><section className="floating-panel testimonials-all"><div className="admin-section-head"><h2>Semua ulasan</h2><span>{result.total} ulasan diterbitkan</span></div>{result.items.length?<AllTestimonials items={result.items}/>:<p className="testimonial-empty">Belum ada ulasan pelanggan.</p>}<TestimonialPagination page={result.page} pageCount={result.pageCount}/></section></main>;
}
