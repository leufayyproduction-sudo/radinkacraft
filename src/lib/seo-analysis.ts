export type SeoSignal={key:string;ok:boolean;warning:boolean;message:string};
export type SeoAnalysisInput={keyword:string;title:string;description:string;slug:string;content:string;imageAlts?:string[];kind?:"product"|"blog"|"page";keywordUsed?:boolean};
const plain=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const includes=(source:string,needle:string)=>Boolean(needle.trim())&&source.toLocaleLowerCase().includes(needle.trim().toLocaleLowerCase());
export function analyzeSeo(input:SeoAnalysisInput){
  const keyword=input.keyword.trim();const text=plain(input.content);const words=text?text.split(/\s+/):[];const wordCount=words.length;const keywordCount=keyword?((text.toLocaleLowerCase().match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length):0;const density=wordCount?keywordCount/wordCount*100:0;
  const firstParagraph=plain((input.content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]||text).slice(0,1000));const headings=(input.content.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi)||[]).map(plain).join(" ");
  const internal=(input.content.match(/href=["']\/(?!\/)[^"']*["']/gi)||[]).length;const external=(input.content.match(/href=["']https:\/\/[^"']*["']/gi)||[]).length;const images=[...(input.content.matchAll(/<img\b[^>]*>/gi))].map(([tag])=>tag);const imagesHaveAlt=images.every(tag=>/\balt=["'][^"']+/.test(tag))&&(input.imageAlts||[]).every((alt)=>alt.trim().length>0);
  const titleLength=input.title.trim().length;const descriptionLength=input.description.trim().length;const signals:SeoSignal[]=[
    {key:"titleKeyword",ok:includes(input.title,keyword),warning:!keyword,message:"Kata kunci ada di judul SEO"},
    {key:"descriptionKeyword",ok:includes(input.description,keyword),warning:!keyword,message:"Kata kunci ada di meta description"},
    {key:"slugKeyword",ok:includes(input.slug.replace(/-/g," "),keyword),warning:!keyword,message:"Kata kunci ada di slug"},
    {key:"firstParagraph",ok:includes(firstParagraph,keyword),warning:!keyword,message:"Kata kunci ada di paragraf pertama"},
    {key:"headingKeyword",ok:includes(headings,keyword),warning:!keyword,message:"Kata kunci ada di subjudul"},
    {key:"density",ok:density>=.5&&density<=2.5,warning:wordCount<30,message:`Kepadatan kata kunci ${density.toFixed(1)}% (ideal 0,5–2,5%)`},
    {key:"contentLength",ok:wordCount>=(input.kind==="product"?100:300),warning:wordCount<(input.kind==="product"?50:150),message:`Panjang konten ${wordCount} kata (target ${input.kind==="product"?100:300})`},
    {key:"imageAlt",ok:imagesHaveAlt,warning:images.length===0&&(input.imageAlts||[]).length===0,message:"Semua gambar memiliki teks alternatif"},
    {key:"internalLinks",ok:internal>0,warning:internal===0,message:`Tautan internal: ${internal}`},
    {key:"externalLinks",ok:external>0,warning:external===0,message:`Tautan eksternal: ${external}`},
    {key:"titleLength",ok:titleLength>=30&&titleLength<=60,warning:titleLength>0&&titleLength<25,message:`Panjang judul ${titleLength} karakter (30–60)`},
    {key:"descriptionLength",ok:descriptionLength>=120&&descriptionLength<=155,warning:descriptionLength>0&&descriptionLength<100,message:`Panjang deskripsi ${descriptionLength} karakter (120–155)`},
    {key:"keywordUnique",ok:!input.keywordUsed,warning:!!input.keywordUsed,message:input.keywordUsed?"Kata kunci sudah digunakan entitas lain":"Kata kunci belum dipakai entitas lain"},
  ];
  const sentences=text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);const longSentences=sentences.filter(s=>s.split(/\s+/).length>20).length;const paragraphs=(input.content.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)||[]).map((p)=>plain(p).split(/\s+/).filter(Boolean).length);const maxParagraph=Math.max(0,...paragraphs);const headingsCount=(input.content.match(/<h[1-6]\b/gi)||[]).length;const readability:SeoSignal[]=[
    {key:"sentenceLength",ok:!sentences.length||longSentences/sentences.length<=.25,warning:sentences.length===0,message:`Kalimat di atas 20 kata: ${sentences.length?Math.round(longSentences/sentences.length*100):0}%`},
    {key:"paragraphLength",ok:maxParagraph<=150,warning:maxParagraph>180,message:`Paragraf terpanjang ${maxParagraph} kata (maksimal 150)`},
    {key:"subheadingDistribution",ok:wordCount<=300||headingsCount>=Math.ceil(wordCount/300),warning:wordCount>600&&headingsCount===0,message:`Subjudul ${headingsCount} untuk ${wordCount} kata (1 per 300 kata)`},
  ];
  const score=(items:SeoSignal[])=>items.length?items.filter(item=>item.ok).length/items.length:1;return {signals,readability,wordCount,density,seoScore:score(signals),readabilityScore:score(readability)};
}
