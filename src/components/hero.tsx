"use client";

import Image from "next/image";
import { useState } from "react";
import { formatRupiah, homepageContent } from "@/data/homepage";

export function Hero() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [size, setSize] = useState("M");
  const slide = homepageContent.heroSlides[slideIndex];

  function changeSlide(index: number) {
    setSlideIndex(index);
    setSize(homepageContent.heroSlides[index].defaultSize);
  }

  return (
    <section className="hero" aria-label="Produk unggulan">
      <div className="hero-art" key={`art-${slideIndex}`}>
        <Image className="hero-bouquet" src={slide.image} alt={slide.imageAlt} width={685} height={1000} priority />
        <h2 className="hero-date" aria-label={`${slide.day} ${slide.month}`}><span>{slide.day}<sup>{slide.suffix}</sup></span><span className="date-month">{slide.month}</span></h2>
      </div>
      <div className="hero-copy" key={`copy-${slideIndex}`}>
        <svg className="leaf-silhouette" viewBox="0 0 100 120" aria-hidden="true"><g fill="currentColor"><path d="M50 118V30" stroke="currentColor" strokeWidth="2"/><path d="M50 30c-14-4-18-16-14-26 12 4 16 14 14 26zM50 55c16-2 26-12 28-24-14 0-26 8-28 24zM50 70c-16-2-28-12-30-26 16 0 28 10 30 26zM50 95c16-2 28-12 32-26-16 0-30 10-32 26z"/></g></svg>
        <p className="eyebrow">{homepageContent.heroEyebrow}</p>
        <h1>{slide.title}</h1>
        <p className="hero-description">{slide.description}</p>
        <div className="sizes" role="group" aria-label="Pilih ukuran bucket">
          {slide.sizes.map((option) => <button key={option} type="button" aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}
        </div>
        <div className="buybar">
          <span className="price"><small>Rp</small> {formatRupiah(slide.priceBySize[size as keyof typeof slide.priceBySize])}</span>
          <a className="buy-button" href="/toko">{homepageContent.heroButton}</a>
        </div>
      </div>
      <div className="slide-dots" role="group" aria-label="Pilih produk unggulan">
        {homepageContent.heroSlides.map((item, index) => <button key={item.productName} type="button" aria-label={`Tampilkan ${item.productName}`} aria-current={slideIndex === index ? "true" : undefined} onClick={() => changeSlide(index)} />)}
      </div>
      <a className="down-button" href="#produk-unggulan" aria-label="Lihat produk unggulan"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2 5 5 5 5-5" /></svg></a>
    </section>
  );
}
