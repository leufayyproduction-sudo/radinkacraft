import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { z } from "zod";

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk?next=/admin");
  if (profile.role !== "ADMIN") redirect("/akses-ditolak");
  return profile;
}

const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(value))).optional();
export function parseAdminListQuery(input: unknown) {
  return z.object({ q: z.string().max(120).optional(), status: z.string().max(32).optional(), kategori: z.string().max(120).optional(), metode: z.string().max(16).optional(), dari: dateParam, hingga: dateParam, edit: z.string().max(120).optional(), page: z.coerce.number().int().min(1).max(10000).catch(1) }).parse(input);
}
