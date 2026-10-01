import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminBankForm } from "@/components/admin-bank-form";
export default async function BankAccountsPage(){await requireAdmin();const [rows,media]=await Promise.all([prisma.bankAccount.findMany({orderBy:{sortOrder:"asc"}}),prisma.media.findMany({orderBy:{createdAt:"desc"},take:100})]);return <><div className="admin-page-heading"><div><p className="eyebrow">Pembayaran</p><h1>Rekening bank</h1></div></div><AdminBankForm rows={rows} media={media}/></>}
