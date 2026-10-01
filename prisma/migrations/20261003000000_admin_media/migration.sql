CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'PENDING', 'HIDDEN');

CREATE TABLE "Media" (
  "id" TEXT NOT NULL, "path" TEXT NOT NULL, "url" TEXT NOT NULL, "alt" TEXT NOT NULL DEFAULT '',
  "width" INTEGER, "height" INTEGER, "sizeBytes" INTEGER NOT NULL, "mimeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "HeroSlide" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "imageUrl" TEXT NOT NULL,
  "imageAlt" TEXT NOT NULL DEFAULT '', "blendMultiply" BOOLEAN NOT NULL DEFAULT false, "productId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Review" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "content" TEXT NOT NULL, "rating" INTEGER NOT NULL DEFAULT 5,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING', "isSample" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Media_path_key" ON "Media"("path");
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");
CREATE INDEX "HeroSlide_sortOrder_idx" ON "HeroSlide"("sortOrder");
CREATE INDEX "HeroSlide_isActive_idx" ON "HeroSlide"("isActive");
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
CREATE INDEX "Review_isSample_idx" ON "Review"("isSample");
ALTER TABLE "HeroSlide" ADD CONSTRAINT "HeroSlide_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HeroSlide" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
