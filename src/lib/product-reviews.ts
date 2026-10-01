import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ReviewStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";

export async function recalculateProductRating(tx: Prisma.TransactionClient, productId: string) {
  const aggregate = await tx.review.aggregate({ where: { productId, status: ReviewStatus.PUBLISHED }, _avg: { rating: true }, _count: { _all: true } });
  await tx.product.update({ where: { id: productId }, data: { ratingAvg: aggregate._avg.rating ?? 0, ratingCount: aggregate._count._all } });
}

export async function getProductReviewPage(productId: string, options: { page?: number; rating?: number; photos?: boolean; sort?: "newest" | "helpful" } = {}) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const where: Prisma.ReviewWhereInput = { productId, status: ReviewStatus.PUBLISHED, ...(options.rating ? { rating: options.rating } : {}), ...(options.photos ? { photos: { some: {} } } : {}) };
  const [product, counts, rows, total] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId }, select: { ratingAvg: true, ratingCount: true } }),
    prisma.review.groupBy({ by: ["rating"], where: { productId, status: ReviewStatus.PUBLISHED }, _count: { _all: true } }),
    prisma.review.findMany({ where, include: { photos: { orderBy: { sortOrder: "asc" } }, orderItem: { select: { variantName: true } } }, orderBy: options.sort === "helpful" ? [{ helpfulCount: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" }, skip: (page - 1) * 10, take: 10 }),
    prisma.review.count({ where }),
  ]);
  const profile = await getCurrentProfile().catch(() => null);
  const anon = cookies().get("review-voter")?.value;
  const voterKey = profile ? "user:" + profile.id : anon ? "anon:" + createHash("sha256").update(anon).digest("hex") : null;
  const votes = voterKey && rows.length ? await prisma.reviewHelpful.findMany({ where: { reviewId: { in: rows.map((row) => row.id) }, voterKey }, select: { reviewId: true } }) : [];
  const votedIds = new Set(votes.map((vote) => vote.reviewId));
  return { average: product?.ratingAvg ?? 0, ratingCount: product?.ratingCount ?? 0, distribution: Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, counts.find((row) => row.rating === rating)?._count._all ?? 0])), reviews: rows.map((row) => ({ ...row, voted: votedIds.has(row.id), displayName: row.showFullName ? row.displayName : maskReviewName(row.displayName) })), total, page, pageCount: Math.max(1, Math.ceil(total / 10)) };
}

export function maskReviewName(value: string) {
  return value.trim().split(/\s+/).map((part) => part.length < 2 ? (part[0] ?? "*") + "*" : part[0] + "***" + part.at(-1)).join(" ");
}
