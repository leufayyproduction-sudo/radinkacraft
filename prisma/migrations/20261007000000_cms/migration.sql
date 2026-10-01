CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "Page" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
  "blocks" JSONB NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE INDEX "Page_status_idx" ON "Page"("status");

CREATE TABLE "PageRevision" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "blocks" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PageRevision_pageId_createdAt_idx" ON "PageRevision"("pageId", "createdAt");
ALTER TABLE "PageRevision" ADD CONSTRAINT "PageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BlogPost" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" VARCHAR(500) NOT NULL,
  "coverImageUrl" TEXT,
  "coverAlt" TEXT,
  "content" TEXT NOT NULL,
  "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageRevision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
