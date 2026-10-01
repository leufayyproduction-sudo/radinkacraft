import type { Metadata } from "next";
import { Abril_Fatface, DM_Sans, Playfair_Display } from "next/font/google";
import { homepageContent } from "@/data/homepage";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const abril = Abril_Fatface({ weight: "400", subsets: ["latin"], variable: "--font-abril", display: "swap" });
const playfair = Playfair_Display({ weight: "700", subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const dmSans = DM_Sans({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Radinkacraft — Bucket bunga penuh kasih",
  description: "Bucket bunga segar untuk hari istimewa. Dirangkai rapi dan dikirim penuh kasih.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${abril.variable} ${playfair.variable} ${dmSans.variable}`}><CartProvider><div className="page-shell">{children}<footer className="floating-panel site-footer" id="kontak"><a className="footer-brand" href="#beranda">{homepageContent.brand}</a><p>{homepageContent.footer.note}</p><a href={`mailto:${homepageContent.contactEmail}`}>Hubungi kami</a><small>{homepageContent.footer.copyright}</small></footer></div></CartProvider></body></html>;
}
