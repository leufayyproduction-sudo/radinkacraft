import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/admin","/api","/akun","/checkout","/keranjang","/pesanan","/masuk","/daftar"]},sitemap:absoluteUrl("/sitemap.xml")};}
