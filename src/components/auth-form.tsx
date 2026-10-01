import Link from "next/link";
import { signInAction, signUpAction } from "@/app/auth-actions";

export function AuthForm({ mode, error, message, next = "/akun" }: { mode: "signin" | "signup"; error?: string; message?: string; next?: string }) {
  const isSignup = mode === "signup";
  return <main className="auth-page"><section className="floating-panel auth-panel"><p className="eyebrow">{isSignup ? "Selamat datang di Radinkacraft" : "Senang bertemu lagi"}</p><h1>{isSignup ? "Buat akun" : "Masuk ke akunmu"}</h1><p className="auth-intro">{isSignup ? "Simpan detail dan ikuti perjalanan pesanan bungamu." : "Masuk untuk melihat pesanan dan mengelola profil."}</p>
    {error && <p className="form-message form-error" role="alert">{error}</p>}{message && <p className="form-message" role="status">{message}</p>}
    <form action={isSignup ? signUpAction : signInAction} className="auth-form">
      <input type="hidden" name="next" value={next} />
      {isSignup && <><label>Nama<input name="name" autoComplete="name" required minLength={2} /></label><label>Nomor telepon<input name="phone" type="tel" autoComplete="tel" required minLength={8} /></label></>}
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Kata sandi<input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /></label>
      <button className="buy-button" type="submit">{isSignup ? "Daftar" : "Masuk"}</button>
    </form>
    <p className="auth-switch">{isSignup ? "Sudah punya akun?" : "Belum punya akun?"} <Link href={`${isSignup ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`}>{isSignup ? "Masuk" : "Daftar"}</Link></p>
  </section></main>;
}
