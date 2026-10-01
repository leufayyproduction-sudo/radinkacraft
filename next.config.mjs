/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let storageRemotePattern = [];
if (supabaseUrl) {
  try {
    const storageUrl = new URL(supabaseUrl);
    storageRemotePattern = [{ protocol: storageUrl.protocol.slice(0, -1), hostname: storageUrl.hostname, pathname: "/storage/v1/object/**" }];
  } catch {
    storageRemotePattern = [];
  }
}

const supabaseOrigin = (() => { try { return supabaseUrl ? new URL(supabaseUrl).origin : "https://*.supabase.co"; } catch { return "https://*.supabase.co"; } })();
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' ${supabaseOrigin} data: blob: https:; connect-src 'self' ${supabaseOrigin} wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com; frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube-nocookie.com https://player.vimeo.com; media-src 'self' blob:; form-action 'self'; upgrade-insecure-requests` },
];

const nextConfig = { poweredByHeader: false, images: { remotePatterns: storageRemotePattern }, async headers() { return [{ source: "/:path*", headers: securityHeaders }]; } };

export default nextConfig;
