import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isPrivatePage = ["/pesanan", "/akun", "/keranjang", "/checkout", "/admin"].some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  const addPrivateHeaders = (result: NextResponse) => {
    if (isPrivatePage) result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return result;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    if (request.nextUrl.pathname.startsWith("/admin")) return NextResponse.redirect(new URL(`/masuk?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
    return addPrivateHeaders(response);
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }) satisfies SetAllCookies,
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL(`/masuk?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.rewrite(new URL("/akses-ditolak", request.url));
    const profileResponse = await fetch(`${url}/rest/v1/Profile?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
    const profiles = profileResponse.ok ? await profileResponse.json() as Array<{ role?: string }> : [];
    if (profiles[0]?.role !== "ADMIN") return NextResponse.rewrite(new URL("/akses-ditolak", request.url));
  }
  return addPrivateHeaders(response);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*", "/akun/:path*", "/keranjang/:path*", "/checkout/:path*", "/pesanan/:path*", "/masuk", "/daftar", "/keluar"] };
