import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/cms/site-settings-form";
import type { MediaOption } from "@/components/admin-ui";
export default async function AdminSiteSettings(){await requireAdmin();const [{site,nav,footer},media]=await Promise.all([getSiteSettings(),prisma.media.findMany({orderBy:{createdAt:"desc"},take:100})]);return <><div className="admin-page-heading"><div><p className="eyebrow">Pengaturan global</p><h1>Situs</h1></div></div><SiteSettingsForm initial={{site,nav,footer}} media={media as MediaOption[]}/></>}
