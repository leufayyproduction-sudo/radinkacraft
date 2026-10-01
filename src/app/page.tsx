import { Hero } from "@/components/hero";
import { PetalDecorations } from "@/components/petals";
import { SiteNav } from "@/components/site-nav";
import { ProductCard } from "@/components/product-card";
import { homepageContent } from "@/data/homepage";
import { getCategories, getFeaturedProducts } from "@/lib/products";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);
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
    <main className="page-content" id="beranda">
      <div className="stage">
        <PetalDecorations />
        <div className="floating-panel hero-panel"><SiteNav /><Hero /></div>
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
      <section className="floating-panel review-panel"><span className="review-stars" aria-label={homepageContent.review.ratingLabel}>{"★".repeat(homepageContent.review.rating)}</span><blockquote>“{homepageContent.review.quote}”</blockquote><p>{homepageContent.review.author}</p></section>
      <section className="floating-panel cta-panel"><p className="eyebrow">{homepageContent.cta.eyebrow}</p><h2>{homepageContent.cta.title}</h2><p>{homepageContent.cta.text}</p><a className="buy-button" href="/toko">{homepageContent.cta.button}</a></section>
    </main>
  );
}
