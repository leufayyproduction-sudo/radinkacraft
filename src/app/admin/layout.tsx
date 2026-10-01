import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false}};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireAdmin();
  const [orders, reviews, payments, testimonials] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["MENUNGGU_KONFIRMASI", "MENUNGGU_QRIS"] } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "MENUNGGU_KONFIRMASI" } }),
    prisma.testimonial.count({ where: { status: "PENDING" } }),
  ]);
  return <AdminShell name={profile.name || profile.email} orderCount={orders} reviewCount={reviews} paymentCount={payments} testimonialCount={testimonials}>{children}</AdminShell>;
}
