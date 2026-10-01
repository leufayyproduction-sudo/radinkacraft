import "server-only";
import { TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getRecentTestimonials(limit = 30) {
  return prisma.testimonial.findMany({ where: { status: TestimonialStatus.PUBLISHED }, orderBy: { createdAt: "desc" }, take: Math.min(30, limit) });
}

export async function getTestimonialPage(pageNumber = 1, pageSize = 12) {
  const page = Math.max(1, pageNumber);
  const [items, total, aggregate] = await Promise.all([
    prisma.testimonial.findMany({ where: { status: TestimonialStatus.PUBLISHED }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.testimonial.count({ where: { status: TestimonialStatus.PUBLISHED } }),
    prisma.testimonial.aggregate({ where: { status: TestimonialStatus.PUBLISHED }, _avg: { rating: true } }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)), average: aggregate._avg.rating ?? 0 };
}

export function relativeIndonesianDate(date: Date, now = new Date()) {
  const dayKey = (value: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
    return Date.UTC(Number(parts.find((part)=>part.type==="year")?.value), Number(parts.find((part)=>part.type==="month")?.value)-1, Number(parts.find((part)=>part.type==="day")?.value));
  };
  const days = Math.max(0, Math.floor((dayKey(now) - dayKey(date)) / 86400000));
  if (days === 0) return "hari ini";
  if (days === 1) return "1 hari lalu";
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} minggu lalu`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months} bulan lalu` : `${Math.floor(months / 12)} tahun lalu`;
}
