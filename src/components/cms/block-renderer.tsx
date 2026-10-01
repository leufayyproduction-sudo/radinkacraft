import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHeroSlides } from "@/lib/hero";
import { getCategories, getFeaturedProducts, getProductBySlug } from "@/lib/products";
import { getRecentTestimonials } from "@/lib/testimonials";
import { ProductCard } from "@/components/product-card";
import { Hero } from "@/components/hero";
import { PetalDecorations } from "@/components/petals";
import { TestimonialMarquee } from "@/components/testimonial-display";
import { pageBlocksSchema, safeEmbedUrl } from "@/lib/cms/blocks";
import { sanitizeRichText } from "@/lib/cms/sanitize";
import { CmsGallery } from "@/components/cms/cms-gallery";
import { getSiteSettings } from "@/lib/site-settings";

export async function BlockRenderer({ blocks }: { blocks: unknown }) {
  const parsed = pageBlocksSchema.safeParse(blocks);
  if (!parsed.success) return <section className="floating-panel cms-panel"><p>Konten halaman belum dapat ditampilkan.</p></section>;
  return <div className="cms-blocks">{await Promise.all(parsed.data.filter((block) => !block.hidden).map(async (block, index) => {
    switch (block.type) {
      case "hero": {
        const slides = await getHeroSlides().catch(() => []);
        return slides.length ? <div className="stage" key={index}><PetalDecorations/><div className="floating-panel hero-panel"><Hero slides={slides}/></div></div> : null;
      }
      case "teks": return <section className="floating-panel cms-panel cms-rich-text" key={index} dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.html) }} />;
      case "judul": { const Heading = `h${block.level}` as "h1" | "h2" | "h3"; return <section key={index} className="cms-heading" style={{ textAlign: block.align }}><Heading>{block.text}</Heading></section>; }
      case "gambar": { const image = <Image src={block.url} alt={block.alt} width={1200} height={800} className="cms-image" />; return <figure className="floating-panel cms-panel cms-figure" key={index}>{block.href ? <Link href={block.href}>{image}</Link> : image}{block.caption && <figcaption>{block.caption}</figcaption>}</figure>; }
      case "galeri": return <CmsGallery key={index} items={block.items} layout={block.layout}/>;
      case "produkUnggulan": {
        const products = block.mode === "manual" ? await prisma.product.findMany({ where: { id: { in: block.productIds }, status: "PUBLISHED" }, select: { slug: true }, take: block.count }).then((rows) => Promise.all(rows.map((row) => getProductBySlug(row.slug)))).then((rows) => rows.filter(Boolean)) : await getFeaturedProducts(block.count).catch(() => []);
        return <section className="floating-panel content-panel" key={index}><div className="section-heading"><h2>{block.title || "Pilihan rangkaian"}</h2></div><div className="product-grid">{products.map((product) => product && <ProductCard key={product.id} product={product} />)}</div></section>;
      }
      case "kategori": { const categories = await getCategories().catch(() => []); return <section className="floating-panel content-panel" key={index}><div className="section-heading"><h2>{block.title || "Jelajahi kategori"}</h2></div><div className="category-list">{categories.map((category) => <Link className="category-pill" href={`/toko?kategori=${encodeURIComponent(category.slug)}`} key={category.id}>{category.name}</Link>)}</div></section>; }
      case "ulasanTerbaru": { const reviews = await getRecentTestimonials(30).catch(() => []); return <section className="floating-panel testimonials-panel" key={index} role="region" aria-label="Ulasan terbaru"><div className="section-heading"><h2>{block.title || "Ulasan pelanggan"}</h2></div><TestimonialMarquee items={reviews}/><div className="testimonial-footer"><Link href="/ulasan">Lihat semua ulasan</Link></div></section>; }
      case "keunggulan": return <section className="floating-panel content-panel" key={index}><div className="section-heading"><h2>{block.title || "Dari kami, dengan kasih"}</h2></div><div className="benefit-grid">{block.items.map((item, i) => <article key={`${item.title}-${i}`}><span className="benefit-number">{item.icon || `0${i + 1}`}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>;
      case "faq": return <section className="floating-panel content-panel cms-faq" key={index}><div className="section-heading"><h2>{block.title || "Pertanyaan yang sering diajukan"}</h2></div>{block.items.map((item, i) => <details key={`${item.question}-${i}`}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>;
      case "kontak": { const {store}=await getSiteSettings();const whatsapp=String(store.whatsapp||"").replace(/\D/g,"");return <section className="floating-panel content-panel cms-contact" key={index}><h2>{block.title || "Hubungi kami"}</h2>{block.address && <p>{block.address}</p>}{block.phone && <p><a href={`tel:${block.phone}`}>{block.phone}</a></p>}{whatsapp&&<p><a className="buy-button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo radinkacraft, saya ingin bertanya tentang rangkaian bunga.")}`} target="_blank" rel="noopener noreferrer">Chat via WhatsApp</a></p>}{block.email && <p><a href={`mailto:${block.email}`}>{block.email}</a></p>}{block.hours && <p>{block.hours}</p>}{block.mapUrl && <iframe title="Peta lokasi" src={safeEmbedUrl(block.mapUrl)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}</section>; }
      case "cta": return <section className="floating-panel cta-panel" key={index}><h2>{block.title}</h2><p>{block.text}</p><Link className="buy-button" href={block.href}>{block.buttonLabel}</Link></section>;
      case "pemisah": return <hr className="cms-divider" key={index}/>;
      case "video": return <section className="floating-panel cms-panel cms-video" key={index}><iframe title="Video Radinkacraft" src={safeEmbedUrl(block.url)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></section>;
    }
  }))}</div>;
}
