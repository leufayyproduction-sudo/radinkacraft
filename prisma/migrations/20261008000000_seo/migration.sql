CREATE TYPE "SeoEntityType" AS ENUM ('PRODUCT', 'CATEGORY', 'PAGE', 'BLOG_POST');
CREATE TYPE "TwitterCardType" AS ENUM ('summary', 'summary_large_image');

CREATE TABLE "SeoMeta" (
  "id" TEXT NOT NULL,
  "entityType" "SeoEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "focusKeyword" TEXT,
  "seoTitle" TEXT,
  "metaDescription" TEXT,
  "canonicalUrl" TEXT,
  "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
  "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImageUrl" TEXT,
  "twitterCard" "TwitterCardType",
  "breadcrumbTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeoMeta_entityType_entityId_key" ON "SeoMeta"("entityType", "entityId");
CREATE INDEX "SeoMeta_entityType_idx" ON "SeoMeta"("entityType");

CREATE TABLE "Redirect" (
  "id" TEXT NOT NULL,
  "fromPath" TEXT NOT NULL,
  "toPath" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL DEFAULT 301,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "hits" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");
CREATE INDEX "Redirect_isActive_idx" ON "Redirect"("isActive");

CREATE TABLE "NotFoundLog" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReferrer" TEXT,
  CONSTRAINT "NotFoundLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotFoundLog_path_key" ON "NotFoundLog"("path");
CREATE INDEX "NotFoundLog_count_idx" ON "NotFoundLog"("count");

ALTER TABLE "SeoMeta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redirect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotFoundLog" ENABLE ROW LEVEL SECURITY;
