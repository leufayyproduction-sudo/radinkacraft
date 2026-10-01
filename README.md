# Radinkacraft

Situs toko bucket bunga dan company profile berbahasa Indonesia, memakai Next.js App Router, Prisma 6, dan Supabase.

## Menjalankan lokal

1. Pasang Node.js 22 LTS dan PostgreSQL/Supabase.
2. Salin `.env.example` menjadi `.env.local`, lalu isi variabel yang dibutuhkan. Jangan commit `.env.local`.
3. Jalankan `npm install`, kemudian `npm run dev` dan buka `http://localhost:3000`.
4. Pemeriksaan kode: `npm run lint`, `npm run typecheck`, dan `npm run audit`.

## Menyiapkan Supabase

1. Buat project Supabase di region Mumbai (South Asia) atau region terdekat yang tersedia.
2. Dari menu Database, salin URL pooler transaksi port **6543** untuk `DATABASE_URL`; gunakan parameter `pgbouncer=true&connection_limit=1`.
3. Salin URL session pooler port **5432** untuk `DIRECT_URL`, khusus migrasi.
4. Isi URL project, anon key, dan service role key di environment lokal. Service role key hanya untuk server dan sangat rahasia.
5. Jalankan `npm run db:deploy`, `npm run db:seed`, lalu `npm run storage:setup`.
6. Periksa Storage bucket serta RLS lewat `npm run audit`.

## Admin pertama

Buat akun melalui Supabase Auth di situs, lalu jadikan admin melalui SQL Editor Supabase:

```sql
UPDATE "Profile" SET role = 'ADMIN' WHERE email = 'alamat-admin@example.com';
```

Gunakan alamat email akun yang benar dan ganti password awal dengan password unik yang kuat.

## Deploy ke Vercel

1. Impor repository GitHub ke Vercel atau pasang Vercel CLI dan hubungkan project.
2. Isi seluruh environment variables dari `.env.example` pada Environment Settings Vercel (Production, Preview sesuai kebutuhan).
3. Jalankan deploy dengan `vercel --prod`. Build production menjalankan `prisma migrate deploy && next build`.
4. `vercel.json` menempatkan fungsi pada region Mumbai (`bom1`) dan menjadwalkan cron kedaluwarsa setiap hari. Cron dapat dijadikan tiap jam pada paket Pro.
5. Tambahkan domain di Vercel, atur DNS sesuai instruksi Vercel, lalu tunggu sertifikat SSL aktif.
6. Di Supabase Auth → URL Configuration, set Site URL ke domain produksi dan tambahkan domain asli beserta callback yang dipakai ke Redirect URLs. Aktifkan Confirm email dan sambungkan SMTP khusus (misalnya Resend); email bawaan Supabase memiliki batas pengiriman yang rendah.

**Paket Vercel Hobby tidak boleh digunakan untuk penggunaan komersial. Gunakan paket Pro untuk toko komersial.** Paket gratis Supabase tidak menyediakan point-in-time recovery; ekspor database secara berkala dan simpan cadangan terpisah. Pertimbangkan paket backup yang sesuai sebelum toko menerima transaksi.

## Daftar periksa sebelum toko dibuka

- [ ] Hapus testimoni dan data contoh (`isSample`).
- [ ] Ganti rekening bank contoh dengan rekening asli dan unggah QRIS yang benar.
- [ ] Isi Data toko, nomor WhatsApp, alamat, email, serta zona dan ongkir.
- [ ] Ganti password database, buat ulang service role key, lalu perbarui environment lokal dan Vercel.
- [ ] Ganti password akun admin.
- [ ] Isi SEO: judul, deskripsi, kata kunci, gambar OG, dan data bisnis.
- [ ] Lengkapi teks alternatif seluruh gambar.
- [ ] Uji pesanan dari awal sampai akhir untuk transfer dan QRIS, termasuk konfirmasi, invoice, dan email.
- [ ] Kirim sitemap produksi ke Google Search Console.
- [ ] Jalankan `npm run audit` dan pastikan RLS aktif pada semua tabel database.
