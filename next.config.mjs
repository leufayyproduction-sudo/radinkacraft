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

const nextConfig = { poweredByHeader: false, images: { remotePatterns: storageRemotePattern } };

export default nextConfig;
