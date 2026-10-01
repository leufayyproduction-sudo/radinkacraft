"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const authSchema = z.object({ email: z.string().email("Masukkan alamat email yang benar."), password: z.string().min(8, "Kata sandi minimal 8 karakter.") });
const signupSchema = authSchema.extend({ name: z.string().trim().min(2, "Nama minimal 2 karakter."), phone: z.string().trim().min(8, "Masukkan nomor telepon yang benar.").max(20) });
const safeNext = (value: string) => value.startsWith("/") && !value.startsWith("//") ? value : "/akun";

export async function signInAction(formData: FormData) {
  const limit = await checkRateLimit("login", 10, 60 * 60 * 1000);
  if (!limit.allowed) redirect(`/masuk?error=${encodeURIComponent(limit.message)}`);
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/masuk?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const next = safeNext(String(formData.get("next") || "/akun"));
  const { error } = await createClient().auth.signInWithPassword(parsed.data);
  if (error) redirect(`/masuk?error=${encodeURIComponent("Email atau kata sandi tidak cocok.")}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const limit = await checkRateLimit("signup", 5, 60 * 60 * 1000);
  if (!limit.allowed) redirect(`/daftar?error=${encodeURIComponent(limit.message)}`);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/daftar?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const next = safeNext(String(formData.get("next") || "/akun"));
  const { data, error } = await createClient().auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { name: parsed.data.name, phone: parsed.data.phone } } });
  if (error || !data.user) redirect(`/daftar?error=${encodeURIComponent("Pendaftaran gagal. Periksa email dan coba kembali.")}&next=${encodeURIComponent(next)}`);
  if (data.session) await prisma.profile.upsert({ where: { id: data.user.id }, create: { id: data.user.id, email: parsed.data.email, name: parsed.data.name, phone: parsed.data.phone }, update: { email: parsed.data.email, name: parsed.data.name, phone: parsed.data.phone } });
  redirect(data.session ? next : "/masuk?message=Periksa email untuk mengonfirmasi akun.");
}

export async function signOutAction() {
  await createClient().auth.signOut();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk?next=%2Fakun");
  const name = z.string().trim().min(2).safeParse(formData.get("name"));
  const phone = z.string().trim().min(8).max(20).safeParse(formData.get("phone"));
  if (!name.success || !phone.success) redirect("/akun?error=Nama%20atau%20nomor%20telepon%20tidak%20valid.");
  await prisma.profile.update({ where: { id: profile.id }, data: { name: name.data, phone: phone.data } });
  redirect("/akun?message=Profil%20berhasil%20diperbarui.");
}
