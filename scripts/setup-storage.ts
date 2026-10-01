import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diatur.");
const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
const buckets = [
  { name: "products", public: true, limit: 5 * 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] },
  { name: "reviews", public: true, limit: 5 * 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] },
  { name: "qris", public: true, limit: 5 * 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] },
  { name: "media", public: true, limit: 5 * 1024 * 1024, types: ["image/webp", "image/jpeg", "image/png"] },
  { name: "payment-proofs", public: false, limit: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
];

async function main() {
  for (const bucket of buckets) {
    const { data } = await supabase.storage.getBucket(bucket.name);
    const result = data
      ? await supabase.storage.updateBucket(bucket.name, { public: bucket.public, fileSizeLimit: bucket.limit, allowedMimeTypes: bucket.types })
      : await supabase.storage.createBucket(bucket.name, { public: bucket.public, fileSizeLimit: bucket.limit, allowedMimeTypes: bucket.types });
    if (result.error) throw result.error;
  }
  console.log("Bucket Supabase Storage siap.");
}

main().catch((error) => { console.error("Penyiapan bucket gagal.", error instanceof Error ? error.message : "Kesalahan tidak dikenal."); process.exitCode = 1; });
