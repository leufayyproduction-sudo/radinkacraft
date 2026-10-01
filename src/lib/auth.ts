import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const getCurrentProfile = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return prisma.profile.upsert({ where: { id: user.id }, create: { id: user.id, email: user.email, name: typeof user.user_metadata.name === "string" ? user.user_metadata.name : null, phone: user.phone ?? null }, update: { email: user.email } });
});
