import { CartPage } from "@/components/cart-page";
import { SiteHeader } from "@/components/site-header";
import { noindexMetadata } from "@/lib/noindex";
export const dynamic="force-dynamic";
export const metadata=noindexMetadata;

export default function CartRoute() {
  return <><SiteHeader /><CartPage /></>;
}
