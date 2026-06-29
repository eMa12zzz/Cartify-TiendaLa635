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
    font-family: 'Inter', sans-serif;
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
    font-family: 'Inter', sans-serif;
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
    font-family: 'Inter', sans-serif;
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
    display: flex;
    flex-direction: column;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .sidebar-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    flex-shrink: 0;
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
    gap: 1px;
    flex: 1;
  }
  .sidebar-nav li a {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
    text-decoration: none;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
  }
  .sidebar-nav li a:hover { background: #f0f0f0; }
  .sidebar-nav li a.active { color: #c8860a; font-weight: 500; }
  .sidebar-nav li a svg { width: 14px; height: 14px; opacity: 0.55; flex-shrink: 0; }
  .sidebar-nav li a.active svg { opacity: 1; color: #c8860a; }

  .sidebar-divider {
    border: none;
    border-top: 1px solid #eee;
    margin: 12px 0;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
    text-decoration: none;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .sidebar-link:hover { background: #f0f0f0; }
  .sidebar-bottom {
    margin-top: auto;
  }

  /* MAIN */
  .main {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    border: 1px solid #e8e8e8;
  }
  .main-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 22px;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }

  /* ADDRESS LIST */
  .address-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .address-row {
    display: flex;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid #f2f2f2;
    gap: 12px;
  }
  .address-row:last-of-type {
    border-bottom: none;
  }

  /* Radio */
  .radio-wrap {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .radio-input {
    appearance: none;
    -webkit-appearance: none;
    width: 17px;
    height: 17px;
    border: 1.8px solid #ccc;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: border-color 0.15s;
  }
  .radio-input:checked {
    border-color: #c8860a;
  }
  .radio-input:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c8860a;
  }

  /* Address text */
  .address-text {
    flex: 1;
  }
  .address-name {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
    margin-bottom: 2px;
  }
  .address-detail {
    font-size: 12px;
    color: #aaa;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
  }

  /* Edit btn */
  .edit-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #c8860a;
    cursor: pointer;
    background: none;
    border: none;
    font-weight: 500;
    padding: 4px 6px;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    flex-shrink: 0;
  }
  .edit-btn:hover { background: #fdf3e0; }

  /* Add address */
  .add-address {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #c8860a;
    font-weight: 500;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    margin-top: 14px;
    padding: 0;
  }
  .add-address:hover { text-decoration: underline; }
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
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconPeople  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const navItems = [
  { id: "account",  label: "Detalles de la Cuenta", icon: <IconPerson /> },
  { id: "orders",   label: "Mis pedidos",            icon: <IconBag /> },
  { id: "address",  label: "Direcciones",             icon: <IconMap /> },
  { id: "payment",  label: "Métodos de pago",         icon: <IconCard /> },
  { id: "notifs",   label: "Notificaciones",          icon: <IconBell /> },
  { id: "points",   label: "Puntos de fidelidad",     icon: <IconStar /> },
  { id: "receipts", label: "Recibos",                 icon: <IconReceipt /> },
];

const ADDR = "2972 Westheimer Rd. Santa Ana, Illinois 85486";

const initialAddresses = [
  { id: 1, name: "Casa",          detail: ADDR, selected: true  },
  { id: 2, name: "Casa del abuelo", detail: ADDR, selected: false },
  { id: 3, name: "Oficina",       detail: ADDR, selected: false },
];

export default function Direcciones() {
  const [addresses, setAddresses] = useState(initialAddresses);

  const select = (id) =>
    setAddresses(prev => prev.map(a => ({ ...a, selected: a.id === id })));

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
                <a className={item.id === "address" ? "active" : ""}>
                  {item.icon} {item.label}
                </a>
              </li>
            ))}
          </ul>

          <hr className="sidebar-divider" />

          <div className="sidebar-bottom">
            <a className="sidebar-link">
              <IconPeople /> Cerrar sesión
            </a>
            <a className="sidebar-link">
              <IconHelp /> Centro de ayuda
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <h1 className="main-title">Mis direcciones</h1>

          <div className="address-list">
            {addresses.map(addr => (
              <div className="address-row" key={addr.id}>
                <div className="radio-wrap">
                  <input
                    type="radio"
                    className="radio-input"
                    name="address"
                    checked={addr.selected}
                    onChange={() => select(addr.id)}
                  />
                </div>
                <div className="address-text">
                  <div className="address-name">{addr.name}</div>
                  <div className="address-detail">{addr.detail}</div>
                </div>
                <button className="edit-btn">
                  <IconEdit /> Editar
                </button>
              </div>
            ))}
          </div>

          <button className="add-address">
            <IconPlus /> Añadir dirección
          </button>
        </main>
      </div>
    </>
  );
}