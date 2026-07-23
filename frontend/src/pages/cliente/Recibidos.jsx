import { useState } from "react";

// ─── Placeholder genérico de imagen (ícono foto gris) ────────────────────────
const ImgPlaceholder = ({ size = 56 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 6,
      background: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      {/* Marco foto */}
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#9ca3af" />
      {/* Montaña / landscape */}
      <path d="M2 17 L7 11 L11 15 L15 10 L22 17 Z" fill="#d1d5db" />
      {/* Sol / círculo */}
      <circle cx="17" cy="9" r="2.2" fill="#d1d5db" />
    </svg>
  </div>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconOrders = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 12h6M9 15h4" />
  </svg>
);
const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const IconPayment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);
const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h3" />
  </svg>
);
const IconHelp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const IconCart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IconLogin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);
const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const orders = [
  { id: "#56484156", date: "Apr 5, 2022, 10:07 AM", amount: "$ 54", payment: "Pago con efectivo", qty: 6, extras: 0 },
  { id: "#56484156", date: "Apr 5, 2022, 10:07 AM", amount: "$ 54", payment: "pago con tarjeta",  qty: 6, extras: 0 },
  { id: "#56484156", date: "Apr 5, 2022, 10:07 AM", amount: "$ 54", payment: "Pago con efectivo", qty: 6, extras: 12 },
];

const sideNav = [
  { icon: <IconUser />,    label: "Detalles de la\nCuenta" },
  { icon: <IconOrders />,  label: "Mis pedidos" },
  { icon: <IconLocation />,label: "Direcciones" },
  { icon: <IconPayment />, label: "Metodos de pago" },
  { icon: <IconBell />,    label: "Notificaciones" },
  { icon: <IconStar />,    label: "Puntos de fidelidad" },
  { icon: <IconReceipt />, label: "Recibos", active: true },
  { icon: <IconHelp />,    label: "Centro de ayuda" },
];

const tabs = ["Todos", "Este Mes", "Esta Semana", "Hoy"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecibosPage() {
  const [activeTab, setActiveTab] = useState("Todos");

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f3f4f6", minHeight: "100vh", fontSize: 13, color: "#111827" }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 20px", height: 54,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        {/* Brand */}
        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.15, letterSpacing: -0.3, color: "#111", whiteSpace: "nowrap", minWidth: 62 }}>
          Tienda<br />la 635
        </div>

        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#374151", fontSize: 12, whiteSpace: "nowrap" }}>
          <IconPin />
          10115 New York
        </div>

        {/* Search */}
        <div style={{
          flex: 1, maxWidth: 340, height: 34,
          border: "1px solid #e5e7eb", borderRadius: 20,
          display: "flex", alignItems: "center",
          paddingLeft: 10, paddingRight: 14, gap: 8,
          background: "#fff",
        }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#c8a15a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>O</span>
          </div>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Orange</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Cart */}
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#c8952a", color: "#fff",
            border: "none", borderRadius: 20, padding: "6px 13px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <span style={{ background: "#fff", color: "#c8952a", borderRadius: 6, padding: "1px 5px", fontSize: 11, fontWeight: 700 }}>14</span>
            <IconCart />
            Cart
          </button>
          {/* Login */}
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            border: "1px solid #d1d5db", background: "#fff",
            borderRadius: 20, padding: "6px 13px",
            fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#374151",
          }}>
            <IconLogin />
            Login
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 54px)" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 200,
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBottom: 16,
        }}>
          <div>
            {/* User row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#374151", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>Ema</span>
            </div>

            {/* Nav items */}
            {sideNav.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "9px 18px",
                  cursor: "pointer",
                  background: item.active ? "#fef9ee" : "transparent",
                  color: item.active ? "#92400e" : "#4b5563",
                  fontWeight: item.active ? 600 : 400,
                  fontSize: 13,
                  lineHeight: 1.4,
                  borderLeft: item.active ? "2.5px solid #c8952a" : "2.5px solid transparent",
                }}
              >
                <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ whiteSpace: "pre-line" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 18px 0",
            cursor: "pointer", color: "#6b7280", fontSize: 13,
            borderTop: "1px solid #f3f4f6", marginTop: 8,
          }}>
            <IconLogout />
            <span>Cerrar sesión</span>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: "26px 32px", overflowY: "auto" }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, marginBottom: 18, color: "#111", margin: "0 0 18px" }}>Recibos</h1>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  border: activeTab === tab ? "1.5px solid #111" : "1.5px solid #e5e7eb",
                  background: activeTab === tab ? "#111" : "#fff",
                  color: activeTab === tab ? "#fff" : "#374151",
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Order cards */}
          {orders.map((order, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 12,
              padding: "16px 20px", marginBottom: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 0 }}>

                {/* Order # + date */}
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Pedido {order.id}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{order.date}</div>
                </div>

                {/* Amount + payment */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 130 }}>
                  <span style={{ marginTop: 3 }}><IconEmail /></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{order.amount}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{order.payment}</div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 36, background: "#e5e7eb", margin: "0 18px", flexShrink: 0 }} />

                {/* Products */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ marginTop: 3 }}><IconBox /></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>Productos</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{order.qty}x</div>
                  </div>
                </div>

                {/* Details link */}
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#111", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    Ver detalles <IconExternalLink />
                  </span>
                </div>
              </div>

              {/* Images row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#f9fafb", borderRadius: 10,
                padding: "10px 14px",
              }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <ImgPlaceholder key={j} size={54} />
                ))}
                {order.extras > 0 && (
                  <div style={{
                    width: 54, height: 54, borderRadius: 6,
                    background: "#e5e7eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#374151", fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>
                    +{order.extras}
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}