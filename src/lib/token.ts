import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export function safeTokenEqual(expected: string, supplied: string | null | undefined) {
  const left = createHash("sha256").update(expected).digest();
  const right = createHash("sha256").update(typeof supplied === "string" ? supplied : "").digest();
  return timingSafeEqual(left, right) && Boolean(supplied);
}
