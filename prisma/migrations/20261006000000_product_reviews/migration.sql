-- Preserve the earlier placeholder table (formerly used for store testimonials).
ALTER TABLE "Review" RENAME TO "LegacyReview";
ALTER TABLE "LegacyReview" RENAME CONSTRAINT "Review_pkey" TO "LegacyReview_pkey";
ALTER INDEX "Review_status_createdAt_idx" RENAME TO "LegacyReview_status_createdAt_idx";
ALTER INDEX "Review_isSample_idx" RENAME TO "LegacyReview_isSample_idx";

ALTER TABLE "Product" ADD COLUMN "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "showFullName" BOOLEAN NOT NULL DEFAULT false,
  "rating" INTEGER NOT NULL,
  "body" VARCHAR(1000) NOT NULL,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "sellerReply" TEXT,
  "sellerReplyAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReviewPhoto" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReviewHelpful" (
  "reviewId" TEXT NOT NULL,
  "voterKey" TEXT NOT NULL,
  CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("reviewId", "voterKey")
);

CREATE UNIQUE INDEX "Review_orderItemId_key" ON "Review"("orderItemId");
CREATE INDEX "Review_productId_status_createdAt_idx" ON "Review"("productId", "status", "createdAt");
CREATE INDEX "ReviewPhoto_reviewId_sortOrder_idx" ON "ReviewPhoto"("reviewId", "sortOrder");
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewHelpful" ENABLE ROW LEVEL SECURITY;
