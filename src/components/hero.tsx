"use client";

import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRupiah, homepageContent } from "@/data/homepage";
import { JakartaDate } from "@/components/jakarta-date";

export type HeroSlideData = { id:string; title:string; description:string; image:string; imageAlt:string; blendMultiply:boolean; productSlug:string|null; variants:{name:string;price:number}[]; defaultSize:string; fallbackPrice:number };
export function Hero({ slides }: { slides: HeroSlideData[] }) {
  const [selectedIndex,setSelectedIndex]=useState(0); const [size,setSize]=useState("M"); const [reducedMotion,setReducedMotion]=useState(false);
  const autoplay=useMemo(()=>Autoplay({delay:6000,stopOnInteraction:true,stopOnMouseEnter:true,stopOnFocusIn:true}),[]);
  const [viewportRef,api]=useEmblaCarousel({loop:slides.length>1,watchDrag:slides.length>1},slides.length>1?[autoplay]:[]);
  const onSelect=useCallback(()=>{if(!api)return;const index=api.selectedScrollSnap();setSelectedIndex(index);setSize(slides[index]?.defaultSize??"M");},[api,slides]);
  useEffect(()=>{if(!api)return;onSelect();api.on("select",onSelect);return()=>{api.off("select",onSelect);};},[api,onSelect]);
  useEffect(()=>{const query=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>{setReducedMotion(query.matches);if(!api||slides.length<=1)return;if(query.matches)autoplay.stop();else autoplay.play();};update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[api,autoplay,slides.length]);
  const active=slides[selectedIndex];
  if(!active)return null;
  return <section className="hero" aria-label="Produk unggulan" aria-roledescription="carousel">
    <div className="hero-viewport" ref={viewportRef} tabIndex={0} aria-label="Geser untuk melihat produk unggulan" onKeyDown={(event)=>{if(event.key==="ArrowRight"){event.preventDefault();api?.scrollNext();}if(event.key==="ArrowLeft"){event.preventDefault();api?.scrollPrev();}}}>
      <div className="hero-track">{slides.map((slide,index)=>{
        const current=slides[selectedIndex]?.id===slide.id;const variants=slide.variants.length?slide.variants:[{name:"M",price:slide.fallbackPrice}];const selectedVariant=variants.find((variant)=>variant.name===size)??variants[0];
        const imageSize=slide.image==="/images/hero-tulip.png"?{width:363,height:520}:{width:685,height:1000};
        return <article className="hero-slide" key={slide.id} role="group" aria-roledescription="slide" aria-label={`Slide ${index+1} dari ${slides.length}`} aria-hidden={!current} inert={!current}>
          <div className="hero-art"><Image className={`hero-bouquet${slide.blendMultiply?" hero-blend-multiply":""}`} src={slide.image} alt={slide.imageAlt} width={imageSize.width} height={imageSize.height} sizes="(max-width: 760px) 88vw, 48vw" priority={index===0}/></div>
          <div className={`hero-copy${current?" is-current":""}`}><svg className="leaf-silhouette" viewBox="0 0 100 120" aria-hidden="true"><g fill="currentColor"><path d="M50 118V30" stroke="currentColor" strokeWidth="2"/><path d="M50 30c-14-4-18-16-14-26 12 4 16 14 14 26zM50 55c16-2 26-12 28-24-14 0-26 8-28 24zM50 70c-16-2-28-12-30-26 16 0 28 10 30 26zM50 95c16-2 28-12 32-26-16 0-30 10-32 26z"/></g></svg>
            <p className="eyebrow">{homepageContent.heroEyebrow}</p><h1>{slide.title}</h1><p className="hero-description">{slide.description}</p>
            <div className="sizes" role="group" aria-label="Pilih ukuran bucket">{variants.map((variant)=><button key={variant.name} type="button" aria-pressed={variant.name===size} onClick={()=>setSize(variant.name)}>{variant.name}</button>)}</div>
            <div className="buybar"><span className="price"><small>Rp</small> {formatRupiah(selectedVariant?.price??0)}</span><Link className="buy-button" href={slide.productSlug?`/produk/${slide.productSlug}`:"/toko"}>{homepageContent.heroButton}</Link></div>
          </div>
        </article>;
      })}</div>
    </div>
    <div className="hero-date-layer" aria-hidden="true"><JakartaDate/></div>
    {slides.length>1&&<><div className="slide-dots" role="group" aria-label="Pilih slide">{slides.map((slide,index)=><button key={slide.id} type="button" aria-label={`Slide ${index+1} dari ${slides.length}`} aria-current={selectedIndex===index?"true":undefined} onClick={()=>api?.scrollTo(index)}/>)}</div><div className="hero-arrows"><button type="button" aria-label="Slide sebelumnya" onClick={()=>api?.scrollPrev()}>←</button><button type="button" aria-label="Slide berikutnya" onClick={()=>api?.scrollNext()}>→</button></div></>}
    <a className="down-button" href="#produk-unggulan" aria-label="Lihat produk unggulan"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2 5 5 5 5-5" /></svg></a>
  </section>;
}
