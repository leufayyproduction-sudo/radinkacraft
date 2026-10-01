import type { Metadata } from "next";
import { Abril_Fatface, DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { FallingPetals } from "@/components/falling-petals";
import { SiteFooter } from "@/components/site-footer";
import { buildMetadata } from "@/lib/seo";
import { TrackingScripts } from "@/components/seo/tracking-scripts";
import "./globals.css";

const abril = Abril_Fatface({ weight: "400", subsets: ["latin"], variable: "--font-abril", display: "swap" });
const playfair = Playfair_Display({ weight: "700", subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const dmSans = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({title:"Bucket bunga penuh kasih",description:"Bucket bunga segar untuk hari istimewa. Dirangkai rapi dan dikirim penuh kasih.",path:"/"});
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${abril.variable} ${playfair.variable} ${dmSans.variable}`}><CartProvider><a className="skip-link" href="#main-content">Lewati ke konten</a><div className="page-shell"><FallingPetals/><div id="main-content" tabIndex={-1}>{children}</div><SiteFooter/></div><TrackingScripts/></CartProvider></body></html>;
}
