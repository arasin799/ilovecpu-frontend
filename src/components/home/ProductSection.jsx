import CategorySidebar from "./CategorySidebar";
import ProductCard from "./ProductCard";

export default function ProductSection({
  title,
  sideTitle,
  sideItems = [],
  products = [],
  onAddToCart,
  accentTitle,
}) {
  return (
    <section className="product-section">
      {title ? (
        <div className="section-head">
          <h2>{title}</h2>
          <button type="button">ดูทั้งหมด &gt;</button>
        </div>
      ) : (
        <div className="section-head accent-head">
          <h2 className="section-accent-title">{accentTitle}</h2>
          <button type="button">ดูทั้งหมด &gt;</button>
        </div>
      )}

      <div className="section-layout">
        <CategorySidebar title={sideTitle} items={sideItems} />

        <div className="product-area">
          {title && accentTitle && (
            <div className="section-accent-title sub-accent-title">{accentTitle}</div>
          )}

          <div className="product-grid product-grid-three">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}