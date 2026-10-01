import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    const variantIds = items.map((item: { variantId?: unknown }) => item?.variantId).filter((id: unknown): id is string => typeof id === "string");
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true, product: { status: "PUBLISHED" } },
      include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } } } },
    });
    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    let changed = false;
    const freshItems = items.flatMap((item: { variantId?: unknown; qty?: unknown; note?: unknown; price?: unknown }) => {
      if (typeof item?.variantId !== "string") return [];
      const variant = byId.get(item.variantId);
      if (!variant) { changed = true; return []; }
      const requestedQty = Math.max(1, Math.floor(Number(item.qty) || 1));
      const qty = Math.min(requestedQty, variant.stock);
      const currentPrice = Number(item.price);
      if (currentPrice !== variant.price || requestedQty !== qty) changed = true;
      return [{
        productId: variant.productId,
        variantId: variant.id,
        name: variant.product.name,
        size: variant.name,
        price: variant.price,
        image: variant.product.images[0]?.url ?? "",
        qty,
        note: typeof item.note === "string" ? item.note.slice(0, 200) : "",
        stock: variant.stock,
        available: variant.stock > 0,
      }];
    });
    return NextResponse.json({ items: freshItems, changed });
  } catch {
    return NextResponse.json({ error: "Keranjang belum dapat diperiksa. Silakan coba lagi." }, { status: 503 });
  }
}
