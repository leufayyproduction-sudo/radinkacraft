import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const findings: string[] = [];
async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return (await Promise.all(entries.map(async (entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  }))).flat();
}

async function main() {
  const sourceFiles = [...await filesIn(path.join(root, "src")), ...await filesIn(path.join(root, "scripts"))].filter((file) => /\.(ts|tsx)$/.test(file));
  const serverFiles: Array<{ file: string; source: string }> = await Promise.all(sourceFiles.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
  const actionAndRoute = serverFiles.filter(({ file, source }) => /(?:^|[\\/])actions?\.ts$|(?:^|[\\/])route\.tsx?$/.test(file) && (source.includes('"use server"') || /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)/.test(source)));
  for (const { file, source } of actionAndRoute) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const admin = relative.includes("/admin/") || relative.includes("/api/admin/");
    const guarded = /requireAdmin\s*\(/.test(source);
    const ownership = /safeTokenEqual|authorizedItem|getAuthorizedOrder|accessToken|auth\.getUser|auth\.signOut|getCurrentProfile|CRON_SECRET|checkRateLimit/.test(source) || relative === "src/app/api/cart/validate/route.ts";
    if ((admin && !guarded) || (!admin && !guarded && !ownership)) findings.push(`Aksi/route tanpa penjagaan yang terdeteksi: ${relative}`);
  }
  for (const { file, source } of serverFiles.filter(({ file }) => file.includes(`${path.sep}src${path.sep}app${path.sep}admin${path.sep}`) && /(?:page|layout)\.tsx?$/.test(file))) {
    if (!/requireAdmin\s*\(/.test(source)) findings.push(`Halaman/layout admin tanpa requireAdmin(): ${path.relative(root, file).replaceAll("\\", "/")}`);
  }
  for (const { file, source } of serverFiles) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    if (relative === "scripts/audit.ts") continue;
    if (/SUPABASE_SERVICE_ROLE_KEY/.test(source) && /"use client"|'use client'/.test(source)) findings.push(`Kunci service role berada di modul klien: ${relative}`);
    const prismaRuntime = /import\s+(?:\{[^}]*\bPrismaClient\b|PrismaClient)\s+from\s+["']@prisma\/client/.test(source) || /\bprisma\.(?!client\b)/.test(source);
    if (prismaRuntime && /"use client"|'use client'/.test(source)) findings.push(`Akses Prisma berada di modul klien: ${relative}`);
    if (relative.startsWith("src/lib/") && prismaRuntime && !source.startsWith('import "server-only";')) findings.push(`Modul Prisma belum ditandai server-only: ${relative}`);
  }

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    findings.push("DIRECT_URL tidak tersedia; status RLS database tidak dapat diperiksa.");
  } else {
    const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
    try {
      const unprotected = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT t.tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
        WHERE t.schemaname = 'public' AND c.relrowsecurity = false
        ORDER BY t.tablename`;
      if (unprotected.length) for (const row of unprotected) findings.push(`RLS belum aktif pada tabel public: ${row.tablename}`);
      else console.log("RLS aktif pada seluruh tabel public.");
    } catch {
      findings.push("Query status RLS gagal; periksa ketersediaan DIRECT_URL tanpa membagikan nilainya.");
    } finally { await prisma.$disconnect(); }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    try {
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket/payment-proofs`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
      if (!response.ok) findings.push("Bucket payment-proofs tidak dapat diperiksa melalui Storage API.");
      else if ((await response.json() as { public?: boolean }).public !== false) findings.push("Bucket payment-proofs harus bersifat private.");
      else console.log("Bucket payment-proofs bersifat private.");
    } catch { findings.push("Pemeriksaan bucket payment-proofs gagal."); }
  } else findings.push("Bucket payment-proofs tidak dapat diperiksa karena konfigurasi Supabase tidak tersedia.");

  if (findings.length) {
    console.error("Temuan audit keamanan:");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exitCode = 1;
  } else console.log(`Audit kode selesai: ${actionAndRoute.length} aksi/route telah diperiksa, tanpa temuan kode.`);
}

main().catch(() => { console.error("Audit gagal dijalankan. Periksa koneksi database dan konfigurasi server."); process.exitCode = 1; });
