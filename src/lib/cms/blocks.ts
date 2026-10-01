import { z } from "zod";

const text = z.string().trim();
const isSafeLink = (value: string) => !value || (value.startsWith("/") && !value.startsWith("//")) || /^(https:\/\/|mailto:|tel:)/i.test(value);
const isSafeImage = (value: string) => (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value);
const isGoogleMapsEmbed = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" && ["google.com", "www.google.com", "maps.google.com", "google.co.id", "www.google.co.id"].includes(url.hostname) && url.pathname === "/maps/embed"; } catch { return false; } };
const link = text.max(1000).refine(isSafeLink, "Tautan harus relatif, HTTPS, email, atau telepon.");
const mediaImage = z.object({ url: text.min(1).refine(isSafeImage), alt: text.min(1).max(250), caption: text.max(250).optional() });
const common = { hidden: z.boolean().optional() };

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), ...common, title: text.max(120).optional(), description: text.max(500).optional() }),
  z.object({ type: z.literal("teks"), ...common, html: text.max(20000) }),
  z.object({ type: z.literal("judul"), ...common, level: z.union([z.literal(1), z.literal(2), z.literal(3)]), text: text.min(1).max(180), align: z.enum(["left", "center", "right"]) }),
  z.object({ type: z.literal("gambar"), ...common, url: text.min(1).refine(isSafeImage), alt: text.min(1).max(250), caption: text.max(250).optional(), href: link.optional() }),
  z.object({ type: z.literal("galeri"), ...common, items: z.array(mediaImage).max(30), layout: z.enum(["grid", "slider"]) }),
  z.object({ type: z.literal("produkUnggulan"), ...common, mode: z.enum(["featured", "manual"]), productIds: z.array(text).max(30), count: z.number().int().min(1).max(12), title: text.max(100).optional() }),
  z.object({ type: z.literal("kategori"), ...common, title: text.max(100).optional() }),
  z.object({ type: z.literal("ulasanTerbaru"), ...common, title: text.max(100).optional() }),
  z.object({ type: z.literal("keunggulan"), ...common, title: text.max(100).optional(), items: z.array(z.object({ icon: text.max(30), title: text.min(1).max(80), text: text.min(1).max(300) })).max(12) }),
  z.object({ type: z.literal("faq"), ...common, title: text.max(100).optional(), items: z.array(z.object({ question: text.min(1).max(200), answer: text.min(1).max(2000) })).max(30) }),
  z.object({ type: z.literal("kontak"), ...common, title: text.max(100).optional(), address: text.max(500).optional(), phone: text.max(60).optional(), whatsapp: text.max(60).optional(), email: z.string().email().or(z.literal("")).optional(), hours: text.max(500).optional(), mapUrl: text.max(1000).optional().refine((value) => !value || isGoogleMapsEmbed(value), "Peta harus berupa URL embed Google Maps.") }),
  z.object({ type: z.literal("cta"), ...common, title: text.min(1).max(150), text: text.max(500), buttonLabel: text.min(1).max(60), href: link }),
  z.object({ type: z.literal("pemisah"), ...common }),
  z.object({ type: z.literal("video"), ...common, url: z.string().url().refine((value) => { try { const url = new URL(value); return url.protocol === "https:" && ((["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(url.hostname) && url.pathname.startsWith("/embed/")) || (url.hostname === "player.vimeo.com" && /^\/video\/\d+/.test(url.pathname))); } catch { return false; } }, "Gunakan URL embed YouTube atau Vimeo.") }),
]);

export const pageBlocksSchema = z.array(blockSchema).max(100);
export type CmsBlock = z.infer<typeof blockSchema>;

export function safeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    if (["google.com", "www.google.com", "maps.google.com", "google.co.id", "www.google.co.id"].includes(parsed.hostname) && parsed.pathname === "/maps/embed") return parsed.toString();
    if (["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(parsed.hostname) && /^\/embed\/[\w-]+$/.test(parsed.pathname)) return `https://www.youtube-nocookie.com${parsed.pathname}`;
    if (parsed.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(parsed.pathname)) return parsed.toString();
  } catch { return ""; }
  return "";
}
