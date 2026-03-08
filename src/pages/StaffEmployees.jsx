import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { clearToken, getToken } from "../authStore";
import "../styles/staff.css";

function formatSalary(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return amount.toLocaleString("th-TH");
}

async function parseResponseSafe(res) {
  const text = await res.text();
  const isHtml = /^\s*</.test(text);

  if (!text) {
    return { data: null, isHtml: false };
  }

  try {
    return { data: JSON.parse(text), isHtml: false };
  } catch {
    return { data: text, isHtml };
  }
}

function buildEmployeeEndpoints() {
  const normalizedBase = String(API_BASE || "").replace(/\/+$/, "");
  const endpoints = [
    `${normalizedBase}/api/staff/employees`,
    `${normalizedBase}/staff/employees`,
  ];

  return Array.from(new Set(endpoints));
}

export default function StaffEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  function getAuthHeader() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function handleForbidden() {
    clearToken();
    navigate("/login");
  }

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      setError("");

      const endpoints = buildEmployeeEndpoints();
      let lastError = "ไม่สามารถโหลดข้อมูลพนักงานได้";

      try {
        for (const url of endpoints) {
          const res = await fetch(url, { headers: getAuthHeader() });
          const { data, isHtml } = await parseResponseSafe(res);

          if (res.status === 401 || res.status === 403) {
            handleForbidden();
            return;
          }

          if (res.ok) {
            if (Array.isArray(data)) {
              setEmployees(data);
              return;
            }

            if (isHtml) {
              lastError = "API ตอบกลับเป็น HTML กรุณาตรวจสอบ VITE_API_BASE ให้ชี้ไป backend";
            } else {
              lastError = "รูปแบบข้อมูลพนักงานไม่ถูกต้อง";
            }
            continue;
          }

          if (isHtml) {
            lastError = "เรียก API ไม่ถูกปลายทาง กรุณาตรวจสอบ URL ของ backend";
          } else if (data && typeof data === "object" && data.message) {
            lastError = String(data.message);
          } else {
            lastError = `HTTP ${res.status}`;
          }
        }

        throw new Error(lastError);
      } catch (e) {
        setEmployees([]);
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }

    if (!getToken()) {
      navigate("/login");
      return;
    }

    loadEmployees();
  }, [navigate]);

  const filteredEmployees = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return employees.filter((emp) => {
      if (!q) return true;
      return [
        emp.id,
        emp.position,
        emp.salary,
        emp.nickname,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.phone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [employees, keyword]);

  function logoutStaff() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="staff-page">
      <header className="staff-topbar">
        <div>
          <h1>ข้อมูลพนักงาน</h1>
          <p>รายการข้อมูลส่วนตัวของพนักงานทั้งหมด</p>
        </div>
        <div className="staff-topbar-actions">
          <button type="button" className="staff-secondary-btn" onClick={() => navigate("/staff/products")}>
            กลับหน้าจัดการสินค้า
          </button>
          <button type="button" className="staff-danger-btn" onClick={logoutStaff}>
            ล็อกเอาต์
          </button>
        </div>
      </header>

      <section className="staff-panel staff-list-panel">
        <div className="staff-list-head">
          <h2>รายชื่อพนักงาน</h2>
          <input
            type="text"
            placeholder="ค้นหาจากชื่อ อีเมล เบอร์โทร หรือรหัสพนักงาน"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="staff-info">กำลังโหลดข้อมูลพนักงาน...</p>
        ) : (
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ตำแหน่ง</th>
                  <th>เงินเดือน</th>
                  <th>ชื่อเล่น</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="staff-empty">
                      ไม่พบข้อมูลพนักงาน
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>#{emp.id}</td>
                      <td>{emp.position || "-"}</td>
                      <td>{formatSalary(emp.salary)}</td>
                      <td>{emp.nickname || "-"}</td>
                      <td>
                        <strong>{`${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "-"}</strong>
                      </td>
                      <td>{emp.email || "-"}</td>
                      <td>{emp.phone || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
