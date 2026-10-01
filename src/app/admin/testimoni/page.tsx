import { TestimonialStatus } from "@prisma/client";
import { parseAdminListQuery, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DeleteSamples, ReviewActions } from "@/components/admin-review-actions";

const labels: Record<string, string> = { PUBLISHED: "Tayang", PENDING: "Menunggu", HIDDEN: "Tersembunyi" };
export default async function TestimonialsAdmin({ searchParams }: { searchParams: { q?: string; status?: string; page?: string } }) {
  await requireAdmin(); const filters = parseAdminListQuery(searchParams); const page = filters.page;
  const status = Object.values(TestimonialStatus).includes(filters.status as TestimonialStatus) ? filters.status as TestimonialStatus : undefined;
  const where = { ...(status ? { status } : {}), ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" as const } }, { message: { contains: filters.q, mode: "insensitive" as const } }] } : {}) };
  const [reviews, total] = await Promise.all([prisma.testimonial.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }), prisma.testimonial.count({ where })]);
  return <><div className="admin-page-heading"><div><p className="eyebrow">Moderasi testimoni toko</p><h1>Testimoni</h1></div><DeleteSamples /></div><form className="admin-search"><input className="admin-input" name="q" placeholder="Cari nama atau isi" defaultValue={filters.q} /><select name="status" defaultValue={filters.status ?? ""}><option value="">Semua status</option>{Object.values(TestimonialStatus).map((state) => <option key={state} value={state}>{labels[state]}</option>)}</select><button className="secondary-button">Filter</button></form><section className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nama</th><th>Isi</th><th>Rating</th><th>Status</th><th>Jenis</th><th>Aksi</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td>{review.name}</td><td className="review-content-cell">{review.message}</td><td>{review.rating}/5</td><td>{labels[review.status]}</td><td>{review.isSample ? "Contoh" : "Pelanggan"}</td><td><ReviewActions id={review.id} status={review.status} name={review.name} /></td></tr>)}</tbody></table></div><div className="admin-pagination">{page > 1 && <a href={`?page=${page - 1}`}>← Sebelumnya</a>}<span>Halaman {page} · {total} testimoni</span>{page * 20 < total && <a href={`?page=${page + 1}`}>Berikutnya →</a>}</div></section></>;
}
