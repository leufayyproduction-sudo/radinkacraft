import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { formatRupiah } from "@/lib/money";

const paid = [OrderStatus.DIBAYAR, OrderStatus.DIPROSES, OrderStatus.DIKIRIM, OrderStatus.SELESAI];
export default async function AdminDashboard() {
  await requireAdmin();
  const now = new Date(); const today = new Date(now); today.setHours(0, 0, 0, 0); const month = new Date(now.getFullYear(), now.getMonth(), 1); const since = new Date(today); since.setDate(today.getDate() - 13);
  const [todayOrders, revenue, toConfirm, waitingQris, variants, recent, rangeOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { status: { in: paid }, createdAt: { gte: month } }, _sum: { total: true } }),
    prisma.order.count({ where: { status: OrderStatus.MENUNGGU_KONFIRMASI } }),
    prisma.order.count({ where: { status: OrderStatus.MENUNGGU_QRIS } }),
    prisma.productVariant.findMany({ where: { isActive: true }, select: { stock: true, product: { select: { id: true, name: true, slug: true } } } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { in: paid } }, select: { createdAt: true, total: true } }),
  ]);
  const stock = new Map<string, { name: string; slug: string; total: number }>(); variants.forEach(({ stock: amount, product }) => { const old = stock.get(product.id) ?? { name: product.name, slug: product.slug, total: 0 }; old.total += amount; stock.set(product.id, old); });
  const lowStock = [...stock.values()].filter((product) => product.total < 5).length;
  const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(since); date.setDate(since.getDate() + index); return { key: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date), amount: 0 }; });
  rangeOrders.forEach((order) => { const day = days.find((entry) => entry.key === new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), order.createdAt.getDate()).toISOString().slice(0, 10)); if (day) day.amount += order.total; });
  const max = Math.max(1, ...days.map((day) => day.amount)); const bars = days.map((day, index) => `${30 + index * 57},${160 - Math.round(day.amount / max * 130)}`).join(" ");
  return <><div className="admin-page-heading"><div><p className="eyebrow">Ringkasan toko</p><h1>Dashboard</h1></div><Link className="secondary-button" href="/admin/pesanan">Lihat pesanan</Link></div>
    <div className="admin-kpis"><article><span>Pesanan hari ini</span><strong>{todayOrders}</strong></article><article><span>Omzet bulan ini</span><strong>{formatRupiah(revenue._sum.total ?? 0)}</strong></article><article><span>Menunggu konfirmasi</span><strong>{toConfirm}</strong></article><article><span>Menunggu QRIS</span><strong>{waitingQris}</strong></article><article><span>Produk stok menipis</span><strong>{lowStock}</strong></article></div>
    <section className="admin-card admin-chart"><div className="admin-section-head"><h2>Penjualan 14 hari terakhir</h2><span>Nilai pesanan yang dibayar</span></div><svg viewBox="0 0 800 200" role="img" aria-label={`Grafik penjualan, nilai tertinggi ${formatRupiah(max)}`}><path d="M30 160H780" stroke="currentColor" opacity=".2" />{days.map((day,index)=>{const height=Math.max(day.amount ? 6 : 1, Math.round(day.amount/max*130));return <g key={day.key}><rect x={30+index*57} y={160-height} width="30" height={height} rx="5" fill="var(--pink)" opacity=".8"><title>{day.label}: {formatRupiah(day.amount)}</title></rect><text x={30+index*57} y="188" fontSize="10" fill="currentColor">{index%2===0?day.label:""}</text></g>;})}<polyline points={bars} fill="none" stroke="var(--ink)" strokeWidth="2" opacity=".35" /></svg></section>
    {lowStock > 0 && <section className="admin-card"><div className="admin-section-head"><h2>Stok menipis</h2><span>{lowStock} produk</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produk</th><th>Total stok</th></tr></thead><tbody>{[...stock.values()].filter((item)=>item.total<5).map((item)=><tr key={item.slug}><td><Link href={`/admin/produk/${item.slug}`}>{item.name}</Link></td><td>{item.total}</td></tr>)}</tbody></table></div></section>}
    <section className="admin-card"><div className="admin-section-head"><h2>Pesanan terbaru</h2><Link href="/admin/pesanan">Semua pesanan →</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nomor</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th></tr></thead><tbody>{recent.map((order)=><tr key={order.id}><td><Link href={`/admin/pesanan/${order.orderNumber}`}>{order.orderNumber}</Link></td><td>{order.customerName}</td><td>{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium"}).format(order.createdAt)}</td><td>{formatRupiah(order.total)}</td><td><span className={`order-status-pill status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_"," ")}</span></td></tr>)}</tbody></table></div></section>
  </>;
}
