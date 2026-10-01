import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminProductForm } from "@/components/admin-product-form";
export default async function NewAdminProductPage(){await requireAdmin();const [categories,media]=await Promise.all([prisma.category.findMany({where:{isActive:true},orderBy:{sortOrder:"asc"}}),prisma.media.findMany({orderBy:{createdAt:"desc"},take:100})]);return <><div className="admin-page-heading"><div><p className="eyebrow">Katalog bunga</p><h1>Tambah produk</h1></div><Link href="/admin/produk" className="secondary-button">Kembali</Link></div><AdminProductForm categories={categories} media={media}/></>}
