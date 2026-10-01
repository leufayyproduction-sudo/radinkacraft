import { Hero } from "@/components/hero";
import { PetalDecorations } from "@/components/petals";
import { SiteNav } from "@/components/site-nav";
import { ProductCard } from "@/components/product-card";
import { homepageContent } from "@/data/homepage";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import { getHeroSlides } from "@/lib/hero";
import { getRecentTestimonials } from "@/lib/testimonials";
import { getCurrentProfile } from "@/lib/auth";
import { TestimonialForm } from "@/components/testimonial-form";
import { TestimonialMarquee } from "@/components/testimonial-display";
import { prisma } from "@/lib/prisma";
import { BlockRenderer } from "@/components/cms/block-renderer";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { getSeoSettings } from "@/lib/seo";
export const revalidate=60;

export async function generateMetadata():Promise<Metadata>{return buildMetadata({title:"Bucket bunga penuh kasih",description:"Bucket bunga segar untuk hari istimewa. Dirangkai rapi dan dikirim penuh kasih.",path:"/"});}

export default async function HomePage() {
  const seo=await getSeoSettings();
  const business=(seo.business||{}) as {name?:string;logoUrl?:string;address?:string;phone?:string;openingHours?:string;priceRange?:string;socialLinks?:string[]};
  const organization={"@context":"https://schema.org","@type":"Organization",name:business.name||seo.siteName||"Radinkacraft",url:absoluteUrl("/"),...(business.logoUrl?{logo:business.logoUrl}:{}),sameAs:business.socialLinks||[]};
  const website={"@context":"https://schema.org","@type":"WebSite",name:seo.siteName||"Radinkacraft",url:absoluteUrl("/")};
  const localBusiness={"@context":"https://schema.org","@type":"Florist",name:business.name||seo.siteName||"Radinkacraft",url:absoluteUrl("/"),...(business.logoUrl?{image:business.logoUrl,logo:business.logoUrl}:{}),...(business.address?{address:{"@type":"PostalAddress",streetAddress:business.address,addressCountry:"ID"}}:{}),...(business.phone?{telephone:business.phone}:{}),...(business.openingHours?{openingHours:business.openingHours}:{}),...(business.priceRange?{priceRange:business.priceRange}:{})};
  const cmsHome = await prisma.page.findUnique({ where: { slug: "beranda" } }).catch(() => null);
  if (cmsHome?.status === "PUBLISHED") return <main className="page-content cms-public" id="beranda"><JsonLd data={organization}/><JsonLd data={website}/><JsonLd data={localBusiness}/><SiteHeader/><BlockRenderer blocks={cmsHome.blocks}/></main>;
  const [featuredProducts, categories, heroSlides, testimonials, profile] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getCategories().catch(() => []),
    getHeroSlides().catch(() => []),
    getRecentTestimonials(30).catch(() => []),
    getCurrentProfile().catch(() => null),
  ]);
  const slides = heroSlides.length ? heroSlides : homepageContent.heroSlides.map((slide,index)=>({id:`fallback-${index}`,title:slide.title,description:slide.description,image:slide.image,imageAlt:slide.imageAlt,blendMultiply:false,productSlug:["tulip-musim-semi","mawar-untukmu","senja-peach","selamat-wisuda"][index]??null,variants:Object.entries(slide.priceBySize).map(([name,price])=>({name,price})),defaultSize:slide.defaultSize,fallbackPrice:slide.priceBySize.M}));
  const fallbackProducts = homepageContent.products.map((product, index) => ({
    id: `preview-${index}`,
    slug: ["tulip-musim-semi", "mawar-untukmu", "senja-peach"][index],
    name: product.name,
    shortDescription: product.detail,
    minPrice: product.price,
    compareAtPrice: null,
    totalStock: 12,
    primaryImage: { url: product.image, alt: product.alt, blendMultiply: index === 1 },
  }));
  const categoryLinks = categories.length ? categories : homepageContent.categories.map((name) => ({ name, slug: name.toLowerCase().replaceAll(" ", "-") }));
  return (
    <main className="page-content" id="beranda"><JsonLd data={organization}/><JsonLd data={website}/><JsonLd data={localBusiness}/>
      <div className="stage">
        <PetalDecorations />
        <div className="floating-panel hero-panel"><SiteNav /><Hero slides={slides} /></div>
      </div>
      <section className="floating-panel content-panel" id="produk-unggulan">
        <div className="section-heading"><p className="eyebrow">{homepageContent.featuredEyebrow}</p><h2>{homepageContent.featuredHeading}</h2><p>{homepageContent.featuredIntro}</p></div>
        <div className="product-grid" id="toko">{(featuredProducts.length ? featuredProducts : fallbackProducts).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <section className="floating-panel content-panel categories-panel">
        <div className="section-heading"><p className="eyebrow">{homepageContent.categoryEyebrow}</p><h2>{homepageContent.categoryHeading}</h2></div>
        <div className="category-list">{categoryLinks.map((category, index) => <a href={`/toko?kategori=${encodeURIComponent(category.slug)}`} className="category-pill" key={category.slug}><span aria-hidden="true">{["✿", "❀", "✾", "✽", "❋", "✿"][index % 6]}</span>{category.name}</a>)}</div>
      </section>
      <section className="floating-panel content-panel benefits-panel" id="tentang">
        <div className="section-heading"><p className="eyebrow">{homepageContent.benefitsEyebrow}</p><h2>{homepageContent.benefitsHeading}</h2></div>
        <div className="benefit-grid">{homepageContent.benefits.map((benefit, index) => <article key={benefit.title}><span className="benefit-number">0{index + 1}</span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}</div>
      </section>
      <section className="floating-panel testimonials-panel" aria-labelledby="testimonial-heading"><div className="section-heading"><p className="eyebrow">Cerita pelanggan</p><h2 id="testimonial-heading">Ulasan pelanggan</h2></div><TestimonialMarquee items={testimonials}/><div className="testimonial-footer"><a href="/ulasan">Lihat semua ulasan</a></div><div className="testimonial-form-wrap"><h3>Tulis ulasanmu</h3><TestimonialForm initialName={profile?.name??""}/></div></section>
      <section className="floating-panel cta-panel"><p className="eyebrow">{homepageContent.cta.eyebrow}</p><h2>{homepageContent.cta.title}</h2><p>{homepageContent.cta.text}</p><a className="buy-button" href="/toko">{homepageContent.cta.button}</a></section>
    </main>
  );
}
