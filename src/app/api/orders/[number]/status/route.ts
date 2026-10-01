import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { safeTokenEqual } from "@/lib/token";

export async function GET(request: Request, { params }: { params: { number: string } }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const order = await prisma.order.findUnique({ where: { orderNumber: params.number }, include: { payment: true } });
  if (!order || !safeTokenEqual(order.accessToken, token)) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  let changed = false;
  if (order.status === OrderStatus.MENUNGGU_QRIS) {
    const qris = await prisma.qrisAsset.findFirst({ where: { amount: order.total, isActive: true } });
    if (qris) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { orderId: order.id }, data: { qrisAssetId: qris.id } });
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.MENUNGGU_BAYAR } });
        await tx.orderStatusLog.create({ data: { orderId: order.id, fromStatus: OrderStatus.MENUNGGU_QRIS, toStatus: OrderStatus.MENUNGGU_BAYAR, note: "QRIS tersedia untuk nominal pesanan." } });
      });
      changed = true;
    }
  }
  const fresh = changed ? await prisma.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true } }) : null;
  return NextResponse.json({ status: fresh?.status ?? order.status }, { headers: { "Cache-Control": "private, no-store" } });
}
