# PROMPT CODEX — Website Radinkacraft (Toko Bucket Bunga + Company Profile)

> Cara pakai: simpan file ini sebagai `AGENTS.md` di root project kosong, pastikan `hero-bouquet.png` ada di `public/images/`, lalu ketik ke Codex:
> **"Baca AGENTS.md. Kerjakan Fase 1 dulu sampai selesai dan bisa dijalankan, lalu berhenti."** Setelah itu lanjut Fase 2, 3, dst. Jangan minta semuanya sekaligus.

---

## 1. Tujuan

Bangun website **Radinkacraft**: toko online bucket bunga sekaligus company profile. Bahasa antarmuka: **Bahasa Indonesia**. Mata uang: Rupiah (`Rp 149.000`).

## 2. Tech stack (wajib)

- Next.js 14+ (App Router) + TypeScript, server components sebisa mungkin (SEO)
- Tailwind CSS + CSS variables untuk design tokens
- **Hosting: Vercel. Database: Supabase (PostgreSQL)**
- Prisma sebagai ORM ke Supabase Postgres (lihat bagian 12 untuk koneksi & env)
- Auth: **Supabase Auth** (`@supabase/ssr`), email + password, tabel `profiles` dengan role `ADMIN` dan `CUSTOMER`. Semua route `/admin` dan API admin wajib cek role di server
- Upload file: **Supabase Storage**. JANGAN simpan file ke `/public/uploads` karena filesystem Vercel read-only
- Upload dilakukan **langsung dari browser ke Supabase Storage** memakai signed upload URL (batas body serverless Vercel hanya 4,5 MB). Kompres dan ubah ke WebP di browser sebelum upload (`browser-image-compression`), maksimal 5 MB per file
- Email transaksional: Resend (opsional, aktif jika API key ada)
- Invoice PDF: `@react-pdf/renderer`
- Validasi: Zod. Form: React Hook Form
- Font via `next/font/google`: **Abril Fatface**, **Playfair Display (700)**, **DM Sans (400/500/700)**

## 3. Design system (ikuti persis gaya hero)

Semua halaman publik harus terasa satu keluarga dengan hero: **serba pink monokrom, lembut, feminin, elegan**.

**Warna (CSS variables):**
| Token | Nilai |
|---|---|
| `--bg` | `#f4a5b3` |
| `--bg-soft` | `#f8bcc6` |
| `--panel` | `#f9c4cd` → gradasi ke `#fbcfd6` |
| `--ink` | `#7a2e3f` (teks utama, maroon) |
| `--muted` | `#8a5560` |
| `--pink` | `#ec5b8c` |
| `--orange` | `#f79a7c` |
| `--white` | `#ffffff` |

**Tipografi:**
- Angka/tanggal/harga/aksen besar: **Abril Fatface**, warna putih
- Judul (h1–h3): **Playfair Display 700**, warna `--ink`, line-height ±1.08
- Isi: **DM Sans**, 11–14px, warna `--muted`, line-height 1.7, lebar maksimal ±44 karakter
- Jangan pakai huruf kapital semua untuk label. Gunakan sentence case.

**Komponen & pola:**
- Latar halaman: `radial-gradient(circle at 30% 20%, var(--bg-soft), var(--bg))`
- Konten utama berada di **panel melayang**: `background: linear-gradient(135deg,#fbcfd6,#f8bfc9)`, radius kecil (2–6px), bayangan `0 40px 60px -20px rgba(150,50,80,.35)`
- Tombol utama: gradasi `90deg, --orange → --pink`, teks putih bold 12px, radius 5px, bayangan `0 10px 18px -6px rgba(236,91,140,.7)`, hover naik 1px
- Kotak harga/CTA: `rgba(255,255,255,.28)`, radius 6px
- Pilihan ukuran: tombol bulat 26px, aktif = `rgba(255,255,255,.55)`
- Kartu produk: gambar buket di atas panel pink, judul Playfair, harga Abril Fatface putih, tombol gradasi. **Jangan** pakai kartu putih dengan border abu-abu
- Dekorasi: kelopak bunga melayang keluar panel (SVG/PNG, animasi `drift` pelan 9–11 detik, hormati `prefers-reduced-motion`), siluet daun putih transparan 22% di belakang teks
- Nav: logo (ikon tetesan pink + "radinkacraft" Playfair, ditulis huruf kecil), menu Toko / Tentang / Kontak, ikon keranjang dengan titik pink, ikon burger di mobile
- Aksesibilitas: fokus keyboard terlihat, kontras teks memadai, alt text semua gambar

## 4. Hero section (harus mirip referensi)

Layout dua kolom di dalam satu panel melayang, lebar maksimal 1040px.

**Kiri (visual):**
- Gunakan foto asli `/images/hero-bouquet.png` (buket 5 tulip pink dengan daun hijau, **PNG transparan asli**, 685×1000), tinggi ±500px, sedikit menembus keluar batas bawah panel. Tampilkan dengan `next/image` (`priority`, tanpa blur placeholder).
- Gambar sudah transparan, jadi **jangan** pakai `mix-blend-mode` atau latar tambahan. Jangan memotong ulang atau mengubah warna gambar.
- Tambahkan `filter: drop-shadow(0 12px 14px rgba(150,50,80,.25))`.
- Teks tanggal/promo raksasa **putih, Abril Fatface**, menimpa sebagian bunga (contoh: `21st` dengan `st` sebagai superscript, di baris bawah `March`), ukuran `clamp(64px, 9vw, 104px)`, `line-height .82`, `text-shadow` lembut. Teks ini **bisa diedit dari admin** (Pengaturan Hero).
- Tiga kelopak melayang di luar panel (kanan atas, kiri atas, kanan bawah).
- Titik slider vertikal di sisi kiri (4 titik, titik pertama putih) dan tombol bulat panah-bawah di tengah bawah panel.

**Kanan (teks):**
- H1: "Berikan sedikit musim semi" (editable)
- Paragraf singkat 2–3 kalimat
- Pilihan ukuran bucket S / M / L / XL
- Kotak harga (Abril Fatface putih) + tombol "Pesan sekarang"

**Mobile (<760px):** satu kolom, gambar di atas, teks tanggal mengecil ke 64px, nav hanya logo + keranjang + burger.

Hero harus bisa berganti antar produk unggulan (slider) dengan transisi fade halus.

## 5. Halaman publik

1. **Beranda**: hero, produk unggulan, kategori (Bucket, Standing flower, Hand bouquet, Wisuda, Pernikahan, Duka cita), keunggulan, testimoni/ulasan terbaru, CTA
2. **Toko** `/toko`: grid produk, filter kategori/harga/ukuran, urutkan, pencarian
3. **Detail produk** `/produk/[slug]`: galeri gambar, pilihan ukuran, harga, stok, deskripsi, catatan kartu ucapan, tanggal kirim, **ulasan & rating**, produk terkait
4. **Keranjang & Checkout**: data penerima, alamat, tanggal & jam kirim, kartu ucapan, lalu pilih metode bayar: **Transfer Bank** atau **QRIS Dana**. Alur lengkap ada di bagian 8
5. **Akun pelanggan**: daftar/masuk, riwayat pesanan, unduh invoice, tulis ulasan
6. **Company profile**: `/tentang` (cerita, visi misi, tim), `/galeri`, `/faq`, `/kontak` (form, peta, WhatsApp), `/blog` (artikel untuk SEO)
7. Halaman legal: Syarat & Ketentuan, Kebijakan Privasi, Pengiriman & Pengembalian

## 6. Sistem ulasan (seperti Shopee)

- Hanya pelanggan dengan pesanan berstatus `SELESAI` untuk produk itu yang boleh memberi ulasan (label "Pembeli terverifikasi")
- Rating bintang 1–5, teks, upload sampai 5 foto
- Ringkasan rating di halaman produk: rata-rata, jumlah ulasan, distribusi per bintang, filter (dengan foto, per bintang), urut terbaru/paling membantu
- Tombol "Membantu" pada ulasan
- Balasan penjual (admin) di bawah ulasan
- Satu ulasan per item pesanan; boleh diedit dalam 7 hari

## 7. Admin panel `/admin` (wajib lengkap)

Dilindungi middleware role `ADMIN`. Layout sidebar dengan warna sama seperti tema pink (panel putih transparan, aksen pink).

- **Dashboard**: pesanan hari ini, omzet, menunggu konfirmasi bayar, stok menipis, ulasan baru, grafik penjualan
- **Produk**: tambah/ubah/hapus, banyak gambar (drag & drop, urutkan, pilih gambar utama), varian ukuran + harga + stok, kategori, status (draf/terbit), produk unggulan (untuk hero), diskon
- **Media library**: unggah, cari, hapus, edit alt text
- **Kategori**: CRUD
- **Pesanan**: daftar + filter status, detail, ubah status (`MENUNGGU_BAYAR → MENUNGGU_KONFIRMASI → DIBAYAR → DIPROSES → DIKIRIM → SELESAI / DIBATALKAN`)
- **Konfirmasi pembayaran**: antrean pesanan `MENUNGGU_KONFIRMASI`, lihat bukti bayar (transfer/QRIS) berdampingan dengan total pesanan, tombol "Konfirmasi" atau "Tolak" dengan alasan
- **Rekening bank**: CRUD rekening (bank, nomor, atas nama, logo), atur urutan dan aktif/nonaktif
- **Pustaka QRIS**: unggah gambar QRIS Dana per nominal (lihat bagian 8)
- **Invoice**: dibuat otomatis saat pembayaran dikonfirmasi (nomor `INV-YYYYMMDD-0001`), tampil dengan logo, data toko, item, total, status LUNAS; unduh PDF, kirim ke email pelanggan, cetak
- **Ulasan**: daftar semua ulasan, filter bintang/produk, **tombol Hapus** dan **Sembunyikan**, balas ulasan
- **Halaman & konten (CMS)**: lihat bagian 7a. Semua teks dan foto di website bisa diubah dari sini tanpa menyentuh kode
- **Pengaturan hero**: teks tanggal/promo, judul, deskripsi, produk yang ditampilkan
- **Pengaturan toko**: nama, logo, alamat, WhatsApp admin, jam operasional, ongkir per zona, batas waktu pembayaran (default 24 jam), template invoice
- **Pengguna**: daftar pelanggan, kelola admin
- **SEO** (lihat bagian 9)

## 7a. Edit halaman dan foto lewat admin (wajib)

Semua halaman publik dibangun dari **blok/section yang bisa diedit di admin**, bukan teks yang di-hardcode. Pemilik toko tidak boleh perlu membuka kode untuk mengganti teks atau foto.

- **Daftar halaman**: Beranda, Tentang, Galeri, FAQ, Kontak, Syarat & Ketentuan, Kebijakan Privasi, plus halaman baru buatan sendiri (judul, slug, status draf/terbit)
- **Editor berbasis blok** per halaman: tambah, hapus, urutkan (drag & drop), duplikat, sembunyikan. Jenis blok minimal: Hero, Teks/paragraf, Judul, Gambar tunggal, Galeri foto, Slider, Produk unggulan (pilih produk), Kategori, Ulasan terbaru, FAQ (accordion), Kontak + peta, Tombol ajakan (CTA), Pemisah, Embed video
- Setiap blok punya form sederhana: isi teks, pilih gambar, atur tombol/tautan, perataan, dan latar. Blok otomatis memakai gaya pink dari design system
- **Tambah foto dari mana saja**: tombol "Pilih gambar" membuka Media Library (unggah baru atau pilih yang sudah ada), bisa unggah banyak sekaligus, ada potong/putar, isi alt text, dan peringatan jika alt text kosong
- **Pratinjau langsung** (desktop/HP) sebelum terbit, tombol Simpan Draf dan Terbitkan, riwayat revisi dengan tombol pulihkan
- Pengaturan global yang juga bisa diedit: logo, favicon, menu navigasi dan footer, tautan sosial media, info kontak, teks hero beranda
- Tiap halaman punya panel SEO (bagian 9)
- Perubahan yang diterbitkan langsung tampil di situs (gunakan `revalidatePath`/`revalidateTag` Next.js agar tidak perlu deploy ulang)
- Simpan isi blok sebagai JSON di tabel `Page` (kolom `blocks`), validasi dengan Zod, dan sanitasi semua HTML rich text untuk mencegah XSS

## 8. Alur pembayaran (harus mulus dan jelas)

Di halaman checkout, setelah data pengiriman, tampilkan pilihan metode bayar berupa dua kartu besar bergaya tema pink (radio card): **Transfer Bank** dan **QRIS Dana**. Tombol "Buat pesanan" baru aktif setelah metode dipilih. Ringkasan pesanan dan total selalu terlihat di samping (desktop) atau di atas (mobile).

Setelah pesanan dibuat, arahkan ke halaman `/pesanan/[nomor]` (bisa dibuka tanpa login lewat token unik di URL untuk tamu). Halaman ini berisi instruksi bayar, hitung mundur batas waktu, unggah bukti, dan status pesanan.

### 8a. Transfer Bank
- Saat pelanggan memilih Transfer Bank, **langsung tampil** daftar rekening admin aktif (logo bank, nama bank, nomor rekening, atas nama) dengan tombol **Salin nomor rekening** dan total yang harus dibayar (juga bisa disalin)
- **Tepat di bawahnya** ada kolom unggah bukti pembayaran (drag & drop atau kamera di HP, JPG/PNG/WebP/PDF, maks 5 MB, ada pratinjau dan tombol ganti)
- Bukti bisa diunggah saat checkout atau menyusul dari halaman pesanan
- Setelah bukti terkirim, status berubah ke `MENUNGGU_KONFIRMASI`, pelanggan melihat pesan "Bukti diterima, admin akan mengonfirmasi"
- Bukti disimpan di bucket **private** `payment-proofs`, ditampilkan ke admin lewat signed URL berumur pendek

### 8b. QRIS Dana dengan nominal yang diatur sendiri
Admin punya QRIS Dana yang nominalnya harus diatur manual per transaksi. Karena itu sistem memakai **pustaka QRIS per nominal**:

- Di admin, menu **Pustaka QRIS**: tambah entri dengan `nominal` (contoh 20000), `gambar QRIS` (unggah), label opsional, aktif/nonaktif. Nominal harus unik
- Di halaman produk (admin), tiap varian punya tombol pintas "Tambah QRIS untuk harga ini" yang membuka form dengan nominal terisi otomatis
- Saat pelanggan memilih QRIS, sistem mencari QRIS yang nominalnya **sama persis** dengan total pesanan (produk + ongkir − diskon):
  1. **Ketemu**: langsung tampilkan gambar QRIS besar, total yang harus dibayar, petunjuk "Bayar dengan tepat Rp X", tombol Unduh QRIS, dan kolom unggah bukti di bawahnya
  2. **Tidak ketemu**: buat pesanan dengan status `MENUNGGU_QRIS`. Pelanggan melihat pesan "Admin sedang menyiapkan QRIS untuk total Rp X, halaman ini otomatis diperbarui". Admin mendapat notifikasi (badge di sidebar + email + tautan WhatsApp), membuka detail pesanan, mengunggah QRIS untuk nominal itu (opsi centang "Simpan ke pustaka" agar dipakai lagi), lalu status pindah ke `MENUNGGU_BAYAR` dan QRIS langsung muncul di halaman pelanggan. Gunakan Supabase Realtime atau polling 5 detik
  3. Selalu sediakan opsi cadangan "Ganti ke Transfer Bank"
- Jangan tambahkan kode unik pada nominal QRIS, nominal harus persis
- Pelanggan tetap mengunggah bukti (tangkapan layar) setelah bayar, lalu admin mengonfirmasi manual seperti transfer bank

### 8c. Setelah bayar
- Admin menekan **Konfirmasi** → status `DIBAYAR`, invoice `INV-YYYYMMDD-0001` dibuat otomatis (PDF, status LUNAS), pelanggan diberi email + tombol unduh invoice di halaman pesanan dan akunnya
- Admin menekan **Tolak** (wajib isi alasan) → status kembali ke `MENUNGGU_BAYAR`, pelanggan bisa unggah ulang bukti
- Pesanan yang melewati batas waktu bayar otomatis `DIBATALKAN` (Vercel Cron harian atau tiap jam) dan stok dikembalikan
- Stok dikurangi saat pesanan dibuat, dikembalikan bila dibatalkan
- Tombol "Hubungi admin via WhatsApp" dengan pesan otomatis berisi nomor pesanan
- Semua perubahan status dicatat di tabel riwayat (`OrderStatusLog`: siapa, kapan, catatan)

## 9. SEO ala WordPress + Yoast SEO

Pada setiap **produk, kategori, halaman, dan artikel blog**, sediakan panel SEO di admin:

- Focus keyword, SEO title, meta description, slug editable, canonical URL
- **Pratinjau snippet Google** (desktop & mobile) dengan penghitung karakter (title ≤60, description ≤155)
- Robots: index/noindex, follow/nofollow
- Open Graph & Twitter Card (judul, deskripsi, gambar) dengan pratinjau
- **Analisis SEO ala Yoast** dengan indikator hijau/oranye/merah: keyword di title, di meta description, di slug, di paragraf pertama, di heading, panjang konten, alt text gambar, jumlah tautan internal/eksternal, kepadatan keyword
- **Analisis keterbacaan**: panjang kalimat, panjang paragraf, penggunaan subheading
- Breadcrumb otomatis + schema `BreadcrumbList`

Pengaturan SEO global:
- Template title (`%%title%% | Radinkacraft`), pemisah, meta default
- Auto-generate `sitemap.xml` dan `robots.txt`
- Schema JSON-LD: `Organization`, `LocalBusiness` (Florist), `Product` + `AggregateRating` + `Review`, `Article`, `FAQPage`
- Manajer redirect 301 dan pemantau 404
- Verifikasi Google Search Console dan Bing, input Google Analytics/Meta Pixel
- Gambar: WebP, `next/image`, lazy loading, target Lighthouse ≥ 90

## 10. Skema database (Prisma)

`Profile` (terhubung ke `auth.users` Supabase), `Category`, `Product`, `ProductImage`, `ProductVariant`, `Order`, `OrderItem`, `Payment` (metode `BANK`/`QRIS`, jumlah, path bukti, status, dikonfirmasi oleh, alasan tolak), `BankAccount`, `QrisAsset` (nominal unik, path gambar, aktif), `OrderStatusLog`, `Invoice`, `Review`, `ReviewPhoto`, `ReviewHelpful`, `Page` (kolom `blocks` JSON), `PageRevision`, `BlogPost`, `Media`, `SeoMeta` (relasi polimorfik ke entitas), `Redirect`, `Setting`, `HeroSlide`.

Sertakan **seed**: 1 akun admin (dibuat lewat Supabase Auth, role diatur di `profiles`), 2 rekening bank contoh, 1 QRIS contoh, 6 kategori, 8 produk contoh (pakai `hero-bouquet.png` dan `product-sample-rose.jpg` sebagai gambar contoh), 10 ulasan contoh, halaman Tentang/FAQ/Kontak.

## 11. Aset

- Gambar statis situs (hero, logo, kelopak) boleh di `public/images/`. Gambar produk, QRIS, bukti bayar, dan foto ulasan wajib di Supabase Storage.
- `public/images/hero-bouquet.png` adalah foto tulip transparan untuk hero (sudah siap pakai).
- `public/images/product-sample-rose.jpg` adalah foto buket mawar berpita, latar putih, untuk contoh produk (seed). Di kartu produk, tampilkan di atas panel pink dengan `mix-blend-mode: multiply`.
- Kelopak dekoratif: buat SVG sendiri berwarna gradasi `#fde6ea → #f39ab6`.
- Jangan menambah gambar dari internet tanpa lisensi.

## 12. Deployment: Vercel + Supabase

**Bucket Supabase Storage:** `products` (public), `reviews` (public), `qris` (public), `payment-proofs` (**private**), `media` (public). Buat lewat file migrasi SQL di `/supabase/migrations`, lengkap dengan policy: publik boleh baca bucket publik, hanya user login boleh upload ke folder miliknya, hanya admin boleh baca `payment-proofs` milik siapa pun, pelanggan hanya boleh menulis bukti untuk pesanannya sendiri.

**Row Level Security:** aktifkan RLS pada tabel yang dapat diakses klien. Operasi sensitif (konfirmasi bayar, hapus ulasan, invoice) hanya lewat server action/route handler dengan `service_role` dan pengecekan role admin. **Jangan pernah** mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke klien.

**Koneksi database untuk Vercel (serverless):**
- `DATABASE_URL` = connection pooler Supabase (port 6543) dengan `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` = koneksi langsung (port 5432) khusus migrasi Prisma
- Di `schema.prisma` set `url = env("DATABASE_URL")` dan `directUrl = env("DIRECT_URL")`
- Gunakan singleton Prisma client agar tidak menghabiskan koneksi

**File `.env.example` (buat dan isi placeholder):**
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
ADMIN_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
CRON_SECRET=
```

**Vercel:** tambahkan `vercel.json` dengan cron untuk membatalkan pesanan kedaluwarsa (`/api/cron/expire-orders`, dilindungi `CRON_SECRET`). Set `postinstall: prisma generate` dan build command `prisma migrate deploy && next build`. Set `images.remotePatterns` di `next.config` untuk domain Supabase Storage. Jangan memakai fitur yang butuh filesystem tulis atau proses jalan lama (background worker).

**README deploy** harus berisi langkah: buat project Supabase → jalankan migrasi dan seed → buat bucket → isi env di Vercel → deploy → buat akun admin pertama → hubungkan domain.

## 13. Urutan pengerjaan (satu fase per perintah)

1. **Fase 1**: setup project, design tokens, layout, nav, footer, **hero section** persis sesuai bagian 4, beranda dengan data statis
2. **Fase 2**: Prisma + seed, halaman Toko dan Detail produk, keranjang
3. **Fase 3**: Supabase Auth, Supabase Storage (bucket + policy), checkout dengan dua metode bayar (bagian 8a dan 8b), upload bukti bayar, halaman pesanan, akun pelanggan
4. **Fase 4**: admin: dashboard, produk, media, kategori, pesanan
5. **Fase 5**: antrean konfirmasi pembayaran, rekening bank, Pustaka QRIS + alur `MENUNGGU_QRIS`, invoice PDF, email, cron pesanan kedaluwarsa
6. **Fase 6**: sistem ulasan + moderasi admin
7. **Fase 7**: CMS berbasis blok (bagian 7a), Media Library, company profile, blog, pengaturan hero, revalidate otomatis
8. **Fase 8**: modul SEO ala Yoast, sitemap, schema, redirect
9. **Fase 9**: polesan, aksesibilitas, performa, tes, keamanan (RLS, cek role), README deploy ke Vercel

## 14. Kriteria selesai per fase

- `npm run dev` dan `npm run build` berjalan tanpa error, lint dan typecheck bersih
- Tampilan desktop dan mobile dicek dan sesuai design system
- Setiap fase diakhiri ringkasan singkat: apa yang dibuat, cara menjalankan, apa yang belum
- Jangan mengubah design tokens tanpa diminta
- Jangan menghapus file fase sebelumnya tanpa alasan
