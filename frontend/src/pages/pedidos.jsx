import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f5f5f5;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
  }

  /* NAV */
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
  }
  .nav-logo {
    font-weight: 700;
    font-size: 15px;
    line-height: 1.2;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }
  .nav-logo span { display: block; }
  .nav-location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #444;
  }
  .nav-search {
    flex: 1;
    max-width: 340px;
    margin: 0 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #888;
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .nav-cart {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #c8860a;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 20px;
  }
  .nav-login {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 13px;
    cursor: pointer;
    background: #fff;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
  }

  /* LAYOUT */
  .layout {
    display: flex;
    min-height: calc(100vh - 56px);
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 0;
  }

  /* SIDEBAR */
  .sidebar {
    width: 170px;
    flex-shrink: 0;
    padding-right: 16px;
  }
  .sidebar-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-bottom: 20px;
  }
  .sidebar-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 17px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    margin-bottom: 6px;
  }
  .sidebar-name {
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.01em;
  }
  .sidebar-nav {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  }
  .sidebar-nav li a {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555;
    text-decoration: none;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .sidebar-nav li a:hover { background: #f0f0f0; }
  .sidebar-nav li a.active { color: #c8860a; font-weight: 600; }
  .sidebar-nav li a svg { width: 14px; height: 14px; opacity: 0.6; flex-shrink: 0; }
  .sidebar-nav li a.active svg { opacity: 1; color: #c8860a; }
  .sidebar-divider {
    border: none;
    border-top: 1px solid #eee;
    margin: 12px 0;
    width: 100%;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555;
    text-decoration: none;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    width: 100%;
  }
  .sidebar-link:hover { background: #f0f0f0; }

  /* MAIN */
  .main {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    border: 1px solid #e8e8e8;
    overflow: hidden;
  }
  .main-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 20px;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }

  /* FILTER TABS */
  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
  }
  .tab {
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    background: #fff;
    border: none;
    border-right: 1px solid #e0e0e0;
    font-family: 'Inter', sans-serif;
    transition: background 0.15s;
  }
  .tab:last-child { border-right: none; }
  .tab:hover { background: #fafafa; }
  .tab.active {
    color: #c8860a;
    font-weight: 600;
    background: #fff;
    outline: 1.5px solid #c8860a;
    outline-offset: -1px;
    border-radius: 7px;
    z-index: 1;
  }

  /* ORDER CARD */
  .order-card {
    border: 1px solid #ebebeb;
    border-radius: 10px;
    padding: 18px 20px 16px;
    margin-bottom: 16px;
  }
  .order-header {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 14px;
  }
  .order-info {
    flex: 1;
  }
  .order-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 2px;
    font-family: 'Inter', sans-serif;
  }
  .order-date {
    font-size: 12px;
    color: #999;
    font-family: 'Inter', sans-serif;
  }
  .order-meta {
    display: flex;
    align-items: center;
    gap: 28px;
  }
  .order-meta-block {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .order-meta-block svg {
    color: #bbb;
    flex-shrink: 0;
  }
  .order-meta-label {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
  }
  .order-meta-sub {
    font-size: 12px;
    color: #999;
    font-family: 'Inter', sans-serif;
  }
  .order-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .badge-entregado {
    background: #edfaf3;
    color: #1a9955;
    border: 1px solid #b6ebd0;
  }
  .badge-cancelado {
    background: #fff0f0;
    color: #d93025;
    border: 1px solid #f5c2c0;
  }
  .badge-en-curso {
    background: #fff8ed;
    color: #c8860a;
    border: 1px solid #f5d89a;
  }
  .order-action {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 500;
    color: #c8860a;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
    margin-left: 20px;
  }
  .order-action:hover { text-decoration: underline; }

  /* PRODUCT THUMBNAILS */
  .order-products {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: nowrap;
    margin-top: 4px;
  }
  .product-thumb {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    background: #f5f5f5;
    border: 1px solid #ebebeb;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .product-thumb svg {
    color: #ccc;
  }
  .products-more {
    font-size: 13px;
    font-weight: 500;
    color: #555;
    font-family: 'Inter', sans-serif;
    margin-left: 4px;
  }
`;

/* ── Icons ── */
const IconPerson  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconBag     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconMap     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCard    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconBell    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconStar    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconReceipt = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconHelp    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLogout  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPin     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconUser    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconQR      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><line x1="14" y1="14" x2="14" y2="14"/><line x1="17" y1="14" x2="17" y2="14"/><line x1="20" y1="14" x2="20" y2="14"/><line x1="14" y1="17" x2="14" y2="17"/><line x1="17" y1="17" x2="20" y2="17"/><line x1="20" y1="20" x2="20" y2="20"/><line x1="14" y1="20" x2="17" y2="20"/></svg>;
const IconList    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconExtLink = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IconImg     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

/* ── Sidebar nav items ── */
const navItems = [
  { id: "account",  label: "Detalles de la Cuenta", icon: <IconPerson /> },
  { id: "orders",   label: "Mis pedidos",            icon: <IconBag /> },
  { id: "address",  label: "Direcciones",             icon: <IconMap /> },
  { id: "payment",  label: "Métodos de pago",         icon: <IconCard /> },
  { id: "notifs",   label: "Notificaciones",          icon: <IconBell /> },
  { id: "points",   label: "Puntos de fidelidad",     icon: <IconStar /> },
  { id: "receipts", label: "Recibos",                 icon: <IconReceipt /> },
];

/* ── Orders data ── */
const orders = [
  {
    id: 1,
    title: "Orden enviada",
    date: "Apr 5, 2022, 10:07 AM",
    amount: "$ 54",
    payment: "Pago con efectivo",
    products: 6,
    extra: null,
    status: "entregado",
  },
  {
    id: 2,
    title: "Orden cancelada",
    date: "Apr 5, 2022, 10:07 AM",
    amount: "$ 54",
    payment: "pago con trajeta",
    products: 6,
    extra: null,
    status: "cancelado",
  },
  {
    id: 3,
    title: "Orden en curso",
    date: "Apr 5, 2022, 10:07 AM",
    amount: "$ 54",
    payment: "Pago con efectivo",
    products: 6,
    extra: 12,
    status: "en-curso",
  },
];

const BADGE = {
  entregado: { className: "badge-entregado", label: "Entregado" },
  cancelado:  { className: "badge-cancelado",  label: "Cancelada" },
  "en-curso": { className: "badge-en-curso",   label: "En curso" },
};

/* ── Thumb placeholder row ── */
function ProductThumbs({ count, extra }) {
  return (
    <div className="order-products">
      {Array.from({ length: count }).map((_, i) => (
        <div className="product-thumb" key={i}>
          <IconImg />
        </div>
      ))}
      {extra && <span className="products-more">+{extra}</span>}
    </div>
  );
}

/* ── Main component ── */
export default function MisPedidos() {
  const [activeTab, setActiveTab] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "todas",     label: "Todas" },
    { id: "en-curso",  label: "En curso" },
    { id: "entregado", label: "Entregado" },
    { id: "cancelado", label: "Cancelado" },
  ];

  const filtered = orders.filter(o => {
    const matchesTab = activeTab === "todas" ? true : o.status === activeTab;
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = o.title.toLowerCase().includes(searchString) || 
                          o.id.toString().includes(searchString) ||
                          o.amount.toLowerCase().includes(searchString);
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <style>{styles}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">
          <span>Tienda</span>
          <span>la 635</span>
        </div>
        <div className="nav-location">
          <IconPin /> 10115 New York
        </div>
        <div className="nav-search">
          <IconSearch /> Orange
        </div>
        <div className="nav-right">
          <div className="nav-cart">14 Cart</div>
          <button className="nav-login"><IconUser /> Login</button>
        </div>
      </nav>

      {/* Layout */}
      <div className="layout">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-avatar">E</div>
            <div className="sidebar-name">Ema</div>
          </div>

          <ul className="sidebar-nav">
            {navItems.map(item => (
              <li key={item.id}>
                <a className={item.id === "orders" ? "active" : ""}>
                  {item.icon} {item.label}
                </a>
              </li>
            ))}
          </ul>

          <hr className="sidebar-divider" />

          <a className="sidebar-link">
            <IconLogout /> Cerrar sesión
          </a>
          <a className="sidebar-link">
            <IconHelp /> Centro de ayuda
          </a>
        </aside>

        {/* Main */}
        <main className="main">
          <h1 className="main-title">Mis ordenes</h1>

          {/* Tabs and Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div className="tabs" style={{ marginBottom: 0 }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }}>
                <IconSearch />
              </div>
              <input 
                type="text" 
                placeholder="Buscar pedido por título, monto o ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Order cards */}
          {filtered.map(order => {
            const badge = BADGE[order.status];
            return (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  {/* Left: title + date */}
                  <div className="order-info">
                    <div className="order-title">{order.title}</div>
                    <div className="order-date">{order.date}</div>
                  </div>

                  {/* Center metas */}
                  <div className="order-meta">
                    <div className="order-meta-block">
                      <IconQR />
                      <div>
                        <div className="order-meta-label">{order.amount}</div>
                        <div className="order-meta-sub">{order.payment}</div>
                      </div>
                    </div>
                    <div className="order-meta-block">
                      <IconList />
                      <div>
                        <div className="order-meta-label">Productos</div>
                        <div className="order-meta-sub">{order.products}x</div>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <span className={`order-badge ${badge.className}`} style={{ marginLeft: 20 }}>
                    {badge.label}
                  </span>

                  {/* Action */}
                  <button className="order-action">
                    Ver detalles <IconExtLink />
                  </button>
                </div>

                {/* Product thumbnails */}
                <ProductThumbs count={order.products} extra={order.extra} />
              </div>
            );
          })}
        </main>
      </div>
    </>
  );
}