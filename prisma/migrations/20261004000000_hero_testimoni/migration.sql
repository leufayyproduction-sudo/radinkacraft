CREATE TYPE "TestimonialStatus" AS ENUM ('PUBLISHED', 'PENDING', 'HIDDEN');

CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(60) NOT NULL,
  "message" VARCHAR(300) NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "status" "TestimonialStatus" NOT NULL DEFAULT 'PUBLISHED',
  "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
  "isSample" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_status_createdAt_idx" ON "Testimonial"("status", "createdAt");
CREATE INDEX "Testimonial_ipHash_createdAt_idx" ON "Testimonial"("ipHash", "createdAt");
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HeroSlide" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
