import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminProductForm } from "@/components/admin-product-form";
export default async function EditAdminProductPage({params}:{params:{slug:string}}){await requireAdmin();const [product,categories,media,seo]=await Promise.all([prisma.product.findUnique({where:{slug:params.slug},include:{images:{orderBy:[{isPrimary:"desc"},{sortOrder:"asc"}]},variants:{orderBy:{sortOrder:"asc"}}}}),prisma.category.findMany({orderBy:{sortOrder:"asc"}}),prisma.media.findMany({orderBy:{createdAt:"desc"},take:100}),prisma.seoMeta.findUnique({where:{entityType_entityId:{entityType:"PRODUCT",entityId:params.slug}}})]);if(!product)notFound();return <><div className="admin-page-heading"><div><p className="eyebrow">Katalog bunga</p><h1>Ubah produk</h1></div><Link href="/admin/produk" className="secondary-button">Kembali</Link></div><AdminProductForm initial={{...product,seo}} categories={categories} media={media}/></>}
