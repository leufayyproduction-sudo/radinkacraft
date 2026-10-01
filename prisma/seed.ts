import { PrismaClient, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();
const categories = [
  { name: "Bucket", slug: "bucket", description: "Bucket bunga untuk setiap momen.", sortOrder: 1 },
  { name: "Standing flower", slug: "standing-flower", description: "Rangkaian bunga berdiri untuk ucapan dan acara.", sortOrder: 2 },
  { name: "Hand bouquet", slug: "hand-bouquet", description: "Buket tangan yang dirangkai dengan penuh perhatian.", sortOrder: 3 },
  { name: "Wisuda", slug: "wisuda", description: "Buket untuk merayakan kelulusan.", sortOrder: 4 },
  { name: "Pernikahan", slug: "pernikahan", description: "Bunga untuk hari bahagia dan penuh kenangan.", sortOrder: 5 },
  { name: "Duka cita", slug: "duka-cita", description: "Rangkaian bunga sebagai ungkapan belasungkawa.", sortOrder: 6 },
];

const products = [
  { slug: "tulip-musim-semi", name: "Tulip Musim Semi", category: "bucket", featured: true, short: "Lima tulip pink segar dalam balutan lembut.", description: "Lima tangkai tulip pink pilihan dirangkai dengan daun segar dan dibungkus rapi. Hadiah manis untuk ulang tahun, ucapan terima kasih, atau kejutan sederhana.", image: "hero-bouquet.png", alt: "Bucket berisi tulip pink segar", blend: false, prices: [99000, 149000, 219000, 299000], stocks: [15, 12, 8, 4], sale: 119000 },
  { slug: "mawar-untukmu", name: "Mawar Untukmu", category: "bucket", featured: true, short: "Mawar pink lembut dengan pita satin.", description: "Mawar pilihan bernuansa pink disusun dalam bucket cantik dengan pita. Setiap rangkaian dibuat segar agar pesan kasih sampai dengan indah.", image: "product-sample-rose.jpg", alt: "Bucket mawar pink dengan pita satin", blend: true, prices: [129000, 189000, 279000, 369000], stocks: [14, 10, 6, 3] },
  { slug: "senja-peach", name: "Senja Peach", category: "hand-bouquet", featured: true, short: "Buket hangat bernuansa peach dan krem.", description: "Perpaduan bunga warna peach dan krem yang lembut, dibalut kertas buket bernuansa senada. Cocok untuk merayakan hari istimewa.", image: "product-sample-rose.jpg", alt: "Buket bunga bernuansa peach", blend: true, prices: [119000, 179000, 259000, 349000], stocks: [12, 9, 6, 4] },
  { slug: "selamat-wisuda", name: "Selamat Wisuda", category: "wisuda", featured: true, short: "Buket ceria untuk momen kelulusan.", description: "Buket cerah yang siap menemani foto dan ucapan selamat. Rangkaian dapat dilengkapi kartu kecil berisi pesan darimu.", image: "hero-bouquet.png", alt: "Buket bunga tulip untuk hadiah wisuda", blend: false, prices: [99000, 159000, 229000, 319000], stocks: [18, 14, 10, 5] },
  { slug: "papan-doa-kasih", name: "Papan Doa Kasih", category: "standing-flower", featured: false, short: "Rangkaian berdiri untuk menyampaikan perhatian.", description: "Standing flower dengan pilihan bunga segar dan komposisi yang anggun untuk ucapan, peresmian, maupun perayaan keluarga.", image: "product-sample-rose.jpg", alt: "Rangkaian bunga berdiri dengan bunga pilihan", blend: true, prices: [249000, 329000, 389000, 450000], stocks: [8, 6, 5, 3] },
  { slug: "hari-bahagia", name: "Hari Bahagia", category: "pernikahan", featured: false, short: "Buket romantis untuk hari pernikahan.", description: "Rangkaian bunga bernuansa lembut yang melengkapi hari pernikahan dan sesi foto. Dibuat berdasarkan ketersediaan bunga segar.", image: "hero-bouquet.png", alt: "Buket tulip romantis untuk pernikahan", blend: false, prices: [219000, 299000, 379000, 450000], stocks: [9, 7, 5, 3] },
  { slug: "sahabat-sejati", name: "Sahabat Sejati", category: "hand-bouquet", featured: false, short: "Buket kecil penuh warna untuk sahabat.", description: "Buket tangan berisi bunga pilihan dengan palet warna ceria. Hadiah sederhana untuk sahabat, rekan kerja, atau keluarga.", image: "product-sample-rose.jpg", alt: "Buket bunga warna cerah untuk sahabat", blend: true, prices: [109000, 169000, 249000], stocks: [16, 11, 7] },
  { slug: "ungkapan-belasungkawa", name: "Ungkapan Belasungkawa", category: "duka-cita", featured: false, short: "Rangkaian tenang untuk menyampaikan simpati.", description: "Bunga bernuansa putih dan lembut dirangkai dengan sederhana sebagai ungkapan simpati dan doa bagi keluarga yang berduka.", image: "product-sample-rose.jpg", alt: "Rangkaian bunga bernuansa lembut untuk belasungkawa", blend: true, prices: [199000, 279000, 359000, 429000], stocks: [7, 5, 4, 3] },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({ where: { slug: category.slug }, create: category, update: category });
    categoryIds.set(category.slug, saved.id);
  }

  for (const product of products) {
    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, name: product.name, shortDescription: product.short, description: product.description, categoryId: categoryIds.get(product.category)!, status: ProductStatus.PUBLISHED, isFeatured: product.featured },
      update: { name: product.name, shortDescription: product.short, description: product.description, categoryId: categoryIds.get(product.category)!, status: ProductStatus.PUBLISHED, isFeatured: product.featured },
    });
    const photoId = `seed-image-${product.slug}`;
    await prisma.productImage.upsert({ where: { id: photoId }, create: { id: photoId, productId: saved.id, url: `/images/${product.image}`, alt: product.alt, isPrimary: true, sortOrder: 0, blendMultiply: product.blend }, update: { url: `/images/${product.image}`, alt: product.alt, isPrimary: true, sortOrder: 0, blendMultiply: product.blend } });
    for (const [index, name] of ["S", "M", "L", "XL"].slice(0, product.prices.length).entries()) {
      const variant = { price: product.prices[index], stock: product.stocks[index], compareAtPrice: "sale" in product && product.sale && name === "S" ? product.sale : null, sortOrder: index, isActive: true };
      await prisma.productVariant.upsert({ where: { productId_name: { productId: saved.id, name } }, create: { ...variant, productId: saved.id, name }, update: variant });
    }
  }
  const tulip = await prisma.product.findUnique({ where: { slug: "tulip-musim-semi" }, select: { id: true } });
  const rose = await prisma.product.findUnique({ where: { slug: "mawar-untukmu" }, select: { id: true } });
  const slides = [
    { id: "home-hero-tulip", title: "Berikan sedikit musim semi", description: "Lima tulip pink segar dirangkai dengan daun pilihan. Hadiah lembut untuk merayakan momen yang berarti.", imageUrl: "/images/hero-bouquet.png", imageAlt: "Bucket berisi lima bunga tulip pink dengan daun hijau", blendMultiply: false, productId: tulip?.id ?? null, sortOrder: 0, isActive: true },
    { id: "home-hero-rose", title: "Sampaikan rasa lewat mawar", description: "Mawar pilihan dengan pita satin untuk menyampaikan rasa sayang. Dirangkai segar dan dikemas cantik untuk orang tersayang.", imageUrl: "/images/hero-tulip.png", imageAlt: "Buket tulip pink segar dengan daun hijau", blendMultiply: false, productId: rose?.id ?? null, sortOrder: 1, isActive: true },
  ];
  for (const slide of slides) await prisma.heroSlide.upsert({ where: { id: slide.id }, create: slide, update: slide });

  const testimonials = [
    ["Nadia Putri", "Buket tulipnya cantik dan bunganya segar. Pengemasannya rapi, penerima hadiah saya senang sekali.", 5],
    ["Rizky Pratama", "Pesanan datang sesuai jadwal dan tampilannya persis seperti yang saya harapkan.", 5],
    ["Ayu Maharani", "Warna bunganya lembut, cocok untuk hadiah wisuda adik. Terima kasih banyak.", 5],
    ["Dewi Anggraini", "Komunikasi mudah dan buketnya dibuat dengan teliti. Pasti pesan lagi.", 4],
    ["Bima Saputra", "Mawar yang saya pesan terlihat segar dan pitanya manis sekali.", 5],
    ["Siti Rahmawati", "Hadiah ulang tahun jadi lebih berkesan. Bunganya sampai dengan kondisi baik.", 5],
    ["Fajar Nugroho", "Pelayanan ramah dan rangkaiannya sesuai permintaan. Sangat membantu.", 4],
    ["Laras Wulandari", "Buketnya cantik untuk sesi foto wisuda dan dibungkus dengan aman.", 5],
    ["Andini Kusuma", "Pesanan dibuat rapi, kartu ucapannya juga ditulis sesuai pesan saya.", 5],
    ["Dimas Kurniawan", "Bunga segar dan pengiriman tepat waktu. Pengalaman belanja yang menyenangkan.", 4],
  ] as const;
  for (const [index, [name, message, rating]] of testimonials.entries()) {
    await prisma.testimonial.upsert({ where: { id: `sample-testimonial-${index + 1}` }, create: { id: `sample-testimonial-${index + 1}`, name, message, rating, status: "PUBLISHED", isSample: true }, update: { name, message, rating, status: "PUBLISHED", isSample: true } });
  }
  await prisma.blogPost.upsert({ where: { slug: "merawat-buket-bunga" }, create: { slug: "merawat-buket-bunga", title: "Cara sederhana merawat buket bunga", excerpt: "Beberapa langkah ringan untuk menjaga buket tetap cantik lebih lama.", content: "<p>Simpan buket di tempat yang sejuk dan bersihkan air secara berkala.</p>", status: "DRAFT" }, update: { title: "Cara sederhana merawat buket bunga", excerpt: "Beberapa langkah ringan untuk menjaga buket tetap cantik lebih lama.", content: "<p>Simpan buket di tempat yang sejuk dan bersihkan air secara berkala.</p>", status: "DRAFT", publishedAt: null } });
  const defaultPages = [
    { slug: "beranda", title: "Beranda", blocks: [{ type: "hero" }, { type: "produkUnggulan", mode: "featured", productIds: [], count: 4, title: "Rangkaian yang paling disayang" }, { type: "kategori", title: "Bunga untuk setiap cerita" }, { type: "keunggulan", title: "Hal kecil yang berarti", items: [{ icon: "✿", title: "Dirangkai segar", text: "Rangkaian dibuat dengan bunga pilihan dan perhatian." }, { icon: "♡", title: "Dikemas penuh kasih", text: "Setiap pesanan dipersiapkan dengan rapi." }, { icon: "↗", title: "Antar ke tujuan", text: "Pilih alamat dan jadwal saat memesan." }] }, { type: "ulasanTerbaru", title: "Ulasan pelanggan" }, { type: "cta", title: "Buat hari terasa lebih indah", text: "Temukan rangkaian untuk momen yang berarti.", buttonLabel: "Jelajahi toko", href: "/toko" }] },
    { slug: "tentang", title: "Tentang radinkacraft", blocks: [{ type: "judul", level: 1, text: "Tentang radinkacraft", align: "center" }, { type: "teks", html: "<p>Radinkacraft menghadirkan rangkaian bunga untuk menemani berbagai cerita dan momen istimewa. Setiap rangkaian dibuat dengan perhatian pada detail dan dapat disesuaikan melalui pilihan produk yang tersedia.</p>" }] },
    { slug: "galeri", title: "Galeri", blocks: [{ type: "judul", level: 1, text: "Galeri rangkaian", align: "center" }, { type: "galeri", items: [{ url: "/images/hero-bouquet.png", alt: "Bucket tulip pink" }, { url: "/images/product-sample-rose.jpg", alt: "Bucket mawar pink" }], layout: "grid" }] },
    { slug: "faq", title: "Pertanyaan yang sering diajukan", blocks: [{ type: "faq", title: "Pertanyaan yang sering diajukan", items: [{ question: "Bagaimana cara memesan bunga?", answer: "Pilih rangkaian dan ukuran yang tersedia, lalu ikuti langkah pemesanan." }, { question: "Apakah saya dapat menambahkan pesan?", answer: "Pesan dapat ditulis pada kolom kartu ucapan saat pemesanan." }] }] },
    { slug: "kontak", title: "Kontak", blocks: [{ type: "kontak", title: "Hubungi radinkacraft", address: "Informasi alamat dapat ditambahkan oleh pengelola.", phone: "", whatsapp: "", email: "", hours: "Jam layanan dapat ditambahkan oleh pengelola." }] },
    { slug: "syarat-ketentuan", title: "Syarat dan ketentuan", blocks: [{ type: "judul", level: 1, text: "Syarat dan ketentuan", align: "left" }, { type: "teks", html: "<p>Informasi syarat pemesanan, pembayaran, dan pengiriman akan diperbarui oleh pengelola toko.</p>" }] },
    { slug: "kebijakan-privasi", title: "Kebijakan privasi", blocks: [{ type: "judul", level: 1, text: "Kebijakan privasi", align: "left" }, { type: "teks", html: "<p>Informasi mengenai penggunaan data pelanggan akan diperbarui oleh pengelola toko.</p>" }] },
  ];
  for (const page of defaultPages) await prisma.page.upsert({ where: { slug: page.slug }, create: { ...page, isSystem: true, status: "PUBLISHED" }, update: { title: page.title, isSystem: true } });
  await prisma.setting.upsert({ where: { key: "site" }, create: { key: "site", value: { name: "radinkacraft", logoUrl: "", faviconUrl: "" } }, update: {} });
  await prisma.setting.upsert({ where: { key: "nav" }, create: { key: "nav", value: [{ label: "Toko", href: "/toko" }, { label: "Tentang", href: "/tentang" }, { label: "Blog", href: "/blog" }, { label: "Kontak", href: "/kontak" }] }, update: {} });
  await prisma.setting.upsert({ where: { key: "footer" }, create: { key: "footer", value: { note: "Rangkaian bunga penuh kasih untuk setiap cerita.", copyright: "© Radinkacraft. Dirangkai dengan kasih.", address: "", phone: "", email: "", columns: [], socials: [] } }, update: {} });
  await prisma.setting.upsert({ where: { key: "storefront" }, create: { key: "storefront", value: { name: "Radinkacraft", currency: "IDR" } }, update: { value: { name: "Radinkacraft", currency: "IDR" } } });
  await prisma.bankAccount.upsert({ where: { id: "sample-bank-bca" }, create: { id: "sample-bank-bca", bankName: "BCA (contoh)", accountNumber: "0000000000", accountHolder: "radinkacraft (contoh)", sortOrder: 1, isActive: true }, update: { bankName: "BCA (contoh)", accountNumber: "0000000000", accountHolder: "radinkacraft (contoh)", sortOrder: 1, isActive: true } });
  await prisma.bankAccount.upsert({ where: { id: "sample-bank-mandiri" }, create: { id: "sample-bank-mandiri", bankName: "Mandiri (contoh)", accountNumber: "1111111111", accountHolder: "radinkacraft (contoh)", sortOrder: 2, isActive: true }, update: { bankName: "Mandiri (contoh)", accountNumber: "1111111111", accountHolder: "radinkacraft (contoh)", sortOrder: 2, isActive: true } });
  await prisma.setting.upsert({ where: { key: "shipping" }, create: { key: "shipping", value: [{ name: "Dalam kota", fee: 15000 }, { name: "Luar kota dekat", fee: 25000 }, { name: "Ambil di toko", fee: 0 }] }, update: { value: [{ name: "Dalam kota", fee: 15000 }, { name: "Luar kota dekat", fee: 25000 }, { name: "Ambil di toko", fee: 0 }] } });
  await prisma.setting.upsert({ where: { key: "paymentExpiryHours" }, create: { key: "paymentExpiryHours", value: 24 }, update: { value: 24 } });
}

main().finally(() => prisma.$disconnect());
