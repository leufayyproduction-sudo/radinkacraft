import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const secondSlide = slides[1];
  if (!secondSlide) throw new Error("Slide hero aktif urutan kedua tidak ditemukan.");

  await prisma.heroSlide.update({
    where: { id: secondSlide.id },
    data: {
      imageUrl: "/images/hero-tulip.png",
      imageAlt: "Buket tulip pink segar dengan daun hijau",
      blendMultiply: false,
    },
  });
  console.log("Gambar slide hero aktif urutan kedua berhasil diperbarui.");
}

main().finally(() => prisma.$disconnect());
