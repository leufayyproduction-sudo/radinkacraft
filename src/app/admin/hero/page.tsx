import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminHeroForm } from "@/components/admin-hero-form";
import type { MediaOption } from "@/components/admin-ui";
export default async function AdminHeroPage(){await requireAdmin();const [slides,products,media]=await Promise.all([prisma.heroSlide.findMany({orderBy:{sortOrder:"asc"}}),prisma.product.findMany({where:{status:"PUBLISHED"},select:{id:true,name:true},orderBy:{name:"asc"}}),prisma.media.findMany({orderBy:{createdAt:"desc"},take:100})]);return <><div className="admin-page-heading"><div><p className="eyebrow">Beranda</p><h1>Hero slide</h1></div></div><AdminHeroForm slides={slides} products={products} media={media as MediaOption[]}/></>}
