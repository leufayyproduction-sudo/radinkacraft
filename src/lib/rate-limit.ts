import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function checkRateLimit(action: string, limit: number, windowMs: number) {
  const requestHeaders = headers();
  const ip = requestHeaders.get("x-real-ip") || requestHeaders.get("cf-connecting-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const salt = process.env.TESTIMONIAL_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "radinkacraft-rate-limit";
  const key = createHash("sha256").update(`${salt}:${action}:${ip}`).digest("hex");
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const bucket = await prisma.rateLimitCounter.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000));
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds,
    message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfterSeconds / 60)} menit.`,
  };
}
