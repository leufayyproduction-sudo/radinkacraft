export default function ShopLoading() {
  return <main className="shop-page"><div className="floating-panel shop-hero"><div className="loading-line loading-title" /><div className="loading-line loading-copy" /></div><div className="shop-layout"><div className="floating-panel filter-skeleton" /> <div className="shop-grid">{Array.from({ length: 6 }, (_, index) => <div className="product-skeleton" key={index}><div /><span /><span /><span /></div>)}</div></div></main>;
}
