import { useState } from "react";

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
const IconLoginNav = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const sideNav = [
  { icon: <IconUser />,     label: "Detalles de la\nCuenta" },
  { icon: <IconOrders />,   label: "Mi ordenes" },
  { icon: <IconLocation />, label: "Mi direcciones" },
  { icon: <IconPayment />,  label: "Metodos de pago" },
  { icon: <IconBell />,     label: "Notificaciones" },
  { icon: <IconStar />,     label: "Puntos de fidelidad" },
  { icon: <IconReceipt />,  label: "Recibos" },
  { icon: <IconHelp />,     label: "Centro de ayuda", active: true },
];

// ─── Help sections ────────────────────────────────────────────────────────────
const sections = [
  {
    title: "Pagos, cargos y promociones",
    subtitle: "Reciba notificaciones sobre el estado de sus pedidos.",
    articles: [
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
    ],
  },
  {
    title: "Pagos, cargos y promociones",
    subtitle: "Reciba notificaciones sobre el estado de sus pedidos.",
    articles: [
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
    ],
  },
  {
    title: "Pagos, cargos y promociones",
    subtitle: "Reciba notificaciones sobre el estado de sus pedidos.",
    articles: [
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
      "Artículos del centro de ayuda",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CentroDeAyudaPage() {
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
            <span style={{ background: "#fff", color: "#c8952a", borderRadius: 6, padding: "1px 5px", fontSize: 11, fontWeight: 700 }}>13:14</span>
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
            <IconLoginNav />
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
                  color: item.active ? "#c8952a" : "#4b5563",
                  fontWeight: item.active ? 600 : 400,
                  fontSize: 13,
                  lineHeight: 1.4,
                  borderLeft: item.active ? "2.5px solid #c8952a" : "2.5px solid transparent",
                }}
              >
                <span style={{ marginTop: 1, flexShrink: 0, color: item.active ? "#c8952a" : "currentColor" }}>{item.icon}</span>
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
        <main style={{ flex: 1, padding: "26px 32px", overflowY: "auto", background: "#fff" }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, margin: "0 0 24px", color: "#111" }}>Centro de ayuda</h1>

          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 28 }}>
              {/* Section title */}
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 3 }}>
                {section.title}
              </div>
              {/* Section subtitle */}
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                {section.subtitle}
              </div>

              {/* Article rows */}
              {section.articles.map((article, ai) => (
                <div
                  key={ai}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 0",
                    borderTop: "1px solid #f3f4f6",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#111" }}>{article}</span>
                  <IconChevronRight />
                </div>
              ))}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}