import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../config";
import { clearToken, getToken } from "../authStore";
import "../styles/staff.css";

const baseCategoryOptions = [
  "NOTEBOOK",
  "CPU",
  "MAINBOARD",
  "GPU",
  "RAM",
  "PSU",
  "KEYBOARD",
  "MONITOR",
  "ACCESSORY",
  "COOLER",
  "STORAGE",
];

const initialForm = {
  name: "",
  brand: "",
  category: "NOTEBOOK",
  price: "",
  stock: "",
  imageUrl: "",
};

export default function StaffEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreateMode = id === "new";

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [productTitle, setProductTitle] = useState("");

  const categoryOptions = useMemo(() => baseCategoryOptions, []);

  function getAuthHeader() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function handleForbidden() {
    clearToken();
    navigate("/login");
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    if (isCreateMode) {
      setForm(initialForm);
      setProductTitle("สินค้าใหม่");
      setLoading(false);
      return;
    }

    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/staff/products/${id}`, {
          headers: getAuthHeader(),
        });
        const data = await res.json();

        if (res.status === 401 || res.status === 403) {
          handleForbidden();
          return;
        }
        if (!res.ok) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }

        setForm({
          name: data.name || "",
          brand: data.brand || "",
          category: data.category || "NOTEBOOK",
          price: String(data.price ?? ""),
          stock: String(data.stock ?? ""),
          imageUrl: data.imageUrl || "",
        });
        setProductTitle(data.name || `#${id}`);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, isCreateMode, navigate]);

  async function saveProduct(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim().toUpperCase(),
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
    };

    if (!payload.name || !payload.brand || !payload.category) {
      setError("กรุณากรอกชื่อสินค้า ยี่ห้อ และหมวดหมู่");
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError("ราคาสินค้าต้องเป็นตัวเลข 0 ขึ้นไป");
      return;
    }
    if (!Number.isFinite(payload.stock) || payload.stock < 0) {
      setError("จำนวนสินค้าในสต็อกต้องเป็นตัวเลข 0 ขึ้นไป");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isCreateMode
        ? `${API_BASE}/api/staff/products`
        : `${API_BASE}/api/staff/products/${id}`;
      const method = isCreateMode ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        handleForbidden();
        return;
      }
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      navigate("/staff/products");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="staff-page">
      <header className="staff-topbar">
        <div>
          <h1>{isCreateMode ? "เพิ่มสินค้าใหม่" : "แก้ไขข้อมูลสินค้า"}</h1>
          <p>{loading ? "กำลังโหลด..." : productTitle}</p>
        </div>
        <div className="staff-topbar-actions">
          <button type="button" className="staff-secondary-btn" onClick={() => navigate("/staff/products")}>
            กลับไปรายการสินค้า
          </button>
        </div>
      </header>

      <section className="staff-panel">
        <h2>{isCreateMode ? "ฟอร์มเพิ่มสินค้า" : "ฟอร์มแก้ไขสินค้า"}</h2>
        {loading ? (
          <p className="staff-info">กำลังโหลดข้อมูลสินค้า...</p>
        ) : (
          <form className="staff-form-grid" onSubmit={saveProduct}>
            <input
              type="text"
              placeholder="ชื่อสินค้า"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="ยี่ห้อ"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
            />
            <select
              className="staff-select-arrow staff-form-category-select"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              placeholder="ราคา"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              placeholder="จำนวนสินค้าในสต็อก"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            />
            <input
              type="text"
              placeholder="ลิงก์รูปภาพ (ไม่บังคับ)"
              value={form.imageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            />

            {error ? <p className="staff-error">{error}</p> : null}

            <div className="staff-form-actions">
              <button
                type="button"
                className="staff-secondary-btn"
                onClick={() => navigate("/staff/products")}
              >
                ยกเลิก
              </button>
              <button type="submit" className="staff-primary-btn" disabled={saving}>
                {saving ? "กำลังบันทึก..." : isCreateMode ? "เพิ่มสินค้า" : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
