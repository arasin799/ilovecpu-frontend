import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeHeader from "../components/home/HomeHeader";
import HomeFooter from "../components/home/HomeFooter";
import { getToken, clearToken } from "../authStore";
import { API_BASE } from "../config";
import "../styles/home.css";
import "../styles/checkout.css";

export default function Checkout({ cart, setCart }) {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [q, setQ] = useState("");

  // ✅ require login
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const lineItems = useMemo(() => {
    return cart.map((it) => {
      const product = productById.get(it.productId);
      const price = product?.price ?? it.price ?? 0;
      const imageUrl = product?.imageUrl
        ? product.imageUrl.startsWith("http")
          ? product.imageUrl
          : `${API_BASE}${product.imageUrl}`
        : "";

      return {
        productId: it.productId,
        qty: it.qty,
        price,
        name: product?.name ?? it.name ?? `สินค้า #${it.productId}`,
        imageUrl,
      };
    });
  }, [cart, productById]);

  const subtotal = useMemo(() => {
    let total = 0;
    for (const item of lineItems) {
      total += item.price * item.qty;
    }
    return total;
  }, [lineItems]);

  const vat = Math.round(subtotal * 0.07 * 100) / 100;
  const shipping = subtotal === 0 || subtotal >= 5000 ? 0 : 80;
  const discount = 0;
  const grandTotal = subtotal + vat + shipping - discount;

  function inc(id) {
    setCart((prev) => prev.map((x) => (x.productId === id ? { ...x, qty: x.qty + 1 } : x)));
  }

  function dec(id) {
    setCart((prev) =>
      prev
        .map((x) => (x.productId === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function remove(id) {
    setCart((prev) => prev.filter((x) => x.productId !== id));
  }

  async function placeOrder() {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!customerName || !phone || !address) return alert("กรุณากรอกชื่อ เบอร์โทร และที่อยู่");
    if (cart.length === 0) return alert("ยังไม่มีสินค้าในตะกร้า");

    setPlacing(true);
    try {
      const payload = {
        customerName,
        phone,
        address,
        items: cart.map((x) => ({ productId: x.productId, qty: x.qty })),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // ✅ ถ้า token ไม่ผ่าน ให้ logout แล้วไป login
      if (res.status === 401) {
        clearToken();
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      alert("สั่งซื้อสำเร็จ");
      setCart([]);
      navigate("/orders");
    } catch (e) {
      alert(`สั่งซื้อไม่สำเร็จ: ${String(e.message || e)}`);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="checkout-page">
      <HomeHeader
        q={q}
        setQ={setQ}
        onSearch={() => navigate(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        cartCount={cartCount}
      />

      <main className="checkout-main">
        <div className="checkout-steps-frame">
          <ol className="checkout-steps">
            <li className="is-active"><span>1</span> ตะกร้าสินค้า</li>
            <li><span>2</span> รายละเอียด</li>
            <li><span>3</span> ชำระเงิน</li>
          </ol>
        </div>

        <section className="checkout-layout">
          <div className="checkout-left">
            {loadingProducts && <p className="checkout-info">กำลังโหลดสินค้า...</p>}

            {!loadingProducts && lineItems.length === 0 && (
              <div className="checkout-empty">
                <p>ยังไม่มีสินค้าในตะกร้า</p>
                <button type="button" onClick={() => navigate("/")}>กลับไปเลือกสินค้า</button>
              </div>
            )}

            <div className="checkout-item-list">
              {lineItems.map((item) => (
                <article key={item.productId} className="checkout-item-card">
                  <div className="checkout-item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="checkout-item-placeholder">IMG</div>
                    )}
                  </div>

                  <div className="checkout-item-content">
                    <p className="checkout-item-name">{item.name}</p>
                    <div className="checkout-item-bottom">
                      <div className="checkout-item-price">฿{Number(item.price).toLocaleString()}.00</div>

                      <div className="checkout-item-qty">
                        <span>จำนวน</span>
                        <button type="button" onClick={() => dec(item.productId)}>-</button>
                        <strong>{item.qty}</strong>
                        <button type="button" onClick={() => inc(item.productId)}>+</button>
                        <button
                          type="button"
                          className="checkout-remove-btn"
                          aria-label="Remove item"
                          onClick={() => remove(item.productId)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="checkout-summary-card">
            <h3>สรุปรายการสั่งซื้อ</h3>
            <div className="checkout-summary-line">
              <span>ค่าสินค้า :</span>
              <b>฿{subtotal.toLocaleString()}</b>
            </div>
            <div className="checkout-summary-line">
              <span>ภาษีมูลค่าเพิ่ม :</span>
              <b>฿{vat.toLocaleString()}</b>
            </div>
            <div className="checkout-summary-line">
              <span>ค่าจัดส่ง :</span>
              <b>฿{shipping.toLocaleString()}</b>
            </div>
            <div className="checkout-summary-line">
              <span>ส่วนลด :</span>
              <b>฿{discount.toLocaleString()}</b>
            </div>
            <hr />
            <div className="checkout-summary-total">
              <span>ยอดรวม</span>
              <strong>฿{grandTotal.toLocaleString()}</strong>
            </div>

            <button
              type="button"
              className="checkout-place-order-btn"
              disabled={placing || lineItems.length === 0}
              onClick={placeOrder}
            >
              {placing ? "กำลังดำเนินการ..." : "ดำเนินการสั่งซื้อสินค้า"}
            </button>

            <p className="checkout-free-note">ช้อปครบ 5,000 บาทขึ้นไป ส่งฟรีทั่วไทย</p>
          </aside>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
