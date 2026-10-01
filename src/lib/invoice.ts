import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function makeInvoice(tx: Prisma.TransactionClient, order: { id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string; recipientName: string; recipientPhone: string; address: string; city: string; postalCode: string | null; shippingZone: string; deliveryDate: Date; deliverySlot: string; subtotal: number; shippingFee: number; total: number; paymentMethod: string; items: Array<{ productName: string; variantName: string; price: number; qty: number }> }) {
  const existing = await tx.invoice.findUnique({ where: { orderId: order.id } });
  if (existing) return existing;
  const store = await tx.setting.findUnique({ where: { key: "store" } });
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("-", "");
  for (let attempt = 0; attempt < 4; attempt++) {
    const count = await tx.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${date}-` } } });
    try {
      return await tx.invoice.create({ data: { invoiceNumber: `INV-${date}-${String(count + attempt + 1).padStart(4, "0")}`, orderId: order.id, snapshot: { store: store?.value ?? {}, customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone }, recipient: { name: order.recipientName, phone: order.recipientPhone, address: order.address, city: order.city, postalCode: order.postalCode, shippingZone: order.shippingZone, deliveryDate: order.deliveryDate, deliverySlot: order.deliverySlot }, items: order.items, subtotal: order.subtotal, shippingFee: order.shippingFee, total: order.total, paymentMethod: order.paymentMethod } } });
    } catch (error) { if (attempt === 3) throw error; }
  }
  throw new Error("Nomor invoice belum dapat dibuat.");
}
