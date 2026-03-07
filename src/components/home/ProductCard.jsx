import { Link } from "react-router-dom";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card shop-card">
      <Link to={`/products/${product.id}`} className="product-thumb shop-thumb">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-thumb-placeholder">IMG</div>
        )}
      </Link>

      <Link to={`/products/${product.id}`} className="product-name shop-product-name">
        {product.name}
      </Link>

      <div className="product-price shop-product-price">
        ฿{Number(product.price || 0).toLocaleString()}.00
      </div>

      <button
        type="button"
        className="add-cart-btn"
        onClick={() => onAddToCart(product)}
      >
        เพิ่มลงตะกร้า
      </button>
    </div>
  );
}