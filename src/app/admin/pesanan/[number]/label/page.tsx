import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";
export default async function ShippingLabel({params}:{params:{number:string}}){await requireAdmin();const order=await prisma.order.findUnique({where:{orderNumber:params.number}});if(!order)notFound();return <main className="print-label"><PrintButton/><section><p>radinkacraft · Label pengiriman</p><h1>{order.orderNumber}</h1><h2>{order.recipientName}</h2><p>Telepon: {order.recipientPhone}</p><p>{order.address}</p><p>{order.city} {order.postalCode}</p><p>Jadwal: {new Intl.DateTimeFormat("id-ID",{dateStyle:"full"}).format(order.deliveryDate)} · {order.deliverySlot.toLowerCase()}</p>{order.cardMessage&&<blockquote>{order.cardMessage}</blockquote>}</section></main>}
