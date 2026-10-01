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
  await prisma.setting.upsert({ where: { key: "storefront" }, create: { key: "storefront", value: { name: "Radinkacraft", currency: "IDR" } }, update: { value: { name: "Radinkacraft", currency: "IDR" } } });
}

main().finally(() => prisma.$disconnect());
