import "server-only";
import { Resend } from "resend";

type EmailInput = { to: string | string[]; subject: string; html: string };

export async function sendEmail(input: EmailInput) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.info("Email dilewati: RESEND_API_KEY belum diatur."); return false; }
  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({ from: process.env.EMAIL_FROM || "radinkacraft <onboarding@resend.dev>", ...input });
    if (result.error) { console.error("Pengiriman email gagal:", result.error.message); return false; }
    return true;
  } catch (error) { console.error("Pengiriman email gagal:", error); return false; }
}

export function emailTemplate(title: string, content: string) {
  return `<div style="background:#fff4f6;padding:28px;font-family:Arial,sans-serif;color:#7a2e3f"><div style="max-width:600px;margin:auto;background:#fbcfd6;padding:28px;border-radius:8px"><h1 style="color:#b3144f">${title}</h1><div style="line-height:1.7">${content}</div><p style="margin-top:28px">Salam hangat,<br><b>radinkacraft</b></p></div></div>`;
}
import "server-only";
