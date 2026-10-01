import Link from "next/link";
type ReviewState = { id: string; status: string; createdAt: Date } | null;
export function ProductReviewLink({ orderItemId, review, token }: { orderItemId: string; review: ReviewState; token?: string }) {
  if (review && Date.now() - new Date(review.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000) return <span className="product-review-link-done">Ulasan terkirim</span>;
  const label = review ? "Ubah ulasan" : "Beri ulasan";
  return <Link className="secondary-button product-review-link" href={"/ulasan/produk/" + orderItemId + (token ? "?t=" + encodeURIComponent(token) : "")}>{label}</Link>;
}
