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
  .sidebar-bottom { margin-top: auto; }

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
    margin-bottom: 20px;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }

  /* LOYALTY CARD */
  .loyalty-card {
    background: linear-gradient(130deg, #c8860a 0%, #d9960f 55%, #b87208 100%);
    border-radius: 14px;
    padding: 22px 26px;
    position: relative;
    overflow: hidden;
    margin-bottom: 28px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 158px;
  }
  .card-tag {
    position: absolute;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
    width: 96px;
    height: 96px;
    background: rgba(255,255,255,0.18);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .card-tag-hole {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: rgba(200,134,10,0.6);
    border: 1.5px solid rgba(255,255,255,0.5);
    margin-bottom: 4px;
  }
  .card-tag-logo {
    font-weight: 800;
    font-size: 12px;
    color: #fff;
    font-family: 'Inter', sans-serif;
    line-height: 1.25;
    text-align: center;
    letter-spacing: -0.03em;
  }
  .card-top { position: relative; z-index: 1; }
  .card-name {
    font-size: 21px;
    font-weight: 700;
    color: #fff;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.03em;
    margin-bottom: 3px;
  }
  .card-points-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.78);
    font-family: 'Inter', sans-serif;
  }
  .card-bottom { position: relative; z-index: 1; }
  .card-progress-label {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    font-family: 'Inter', sans-serif;
    margin-bottom: 7px;
  }
  .card-progress-bar {
    width: 60%;
    height: 5px;
    background: rgba(255,255,255,0.28);
    border-radius: 3px;
    margin-bottom: 9px;
    overflow: hidden;
  }
  .card-progress-fill {
    height: 100%;
    width: 50%;
    background: #fff;
    border-radius: 3px;
  }
  .card-expiry {
    font-size: 12px;
    color: rgba(255,255,255,0.82);
    font-family: 'Inter', sans-serif;
    font-weight: 400;
  }
  .card-expiry strong { font-weight: 600; }

  /* FAQ */
  .faq { display: flex; flex-direction: column; gap: 20px; }
  .faq-question {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
    margin-bottom: 5px;
  }
  .faq-answer {
    font-size: 12.5px;
    color: #666;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    line-height: 1.65;
  }
`;

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

const navItems = [
  { id: "account",  label: "Detalles de la Cuenta", icon: <IconPerson /> },
  { id: "orders",   label: "Mis pedidos",            icon: <IconBag /> },
  { id: "address",  label: "Direcciones",             icon: <IconMap /> },
  { id: "payment",  label: "Metodos de pago",         icon: <IconCard /> },
  { id: "notifs",   label: "Notificaciones",          icon: <IconBell /> },
  { id: "points",   label: "Puntos de fidelidad",     icon: <IconStar /> },
  { id: "receipts", label: "Recibos",                 icon: <IconReceipt /> },
];

const faqs = [
  {
    q: "¿Cómo conseguir puntos?",
    a: "Cada mayor a 20 dólares consigues un 25%, que te ayudara a completar la barra de puntos, cada que completes esta barra ira incrementado su valor tanto en porcentaje como en puntos de fidelidad.",
  },
  {
    q: "¿Puedo reutilizar puntos?",
    a: "No, no puedes reutilizar puntos pasados el mes, tu tarjeta de fidelidad se renueva automáticamente pasado el mes, así que solo tiene un mes para acumular y gastar puntos de fidelidad.",
  },
];

export default function PuntosDeFidelidad() {
  return (
    <>
      <style>{styles}</style>

      <nav className="nav">
        <div className="nav-logo">
          <span>Tienda</span>
          <span>la 635</span>
        </div>
        <div className="nav-location"><IconPin /> 10115 New York</div>
        <div className="nav-search"><IconSearch /> Orange</div>
        <div className="nav-right">
          <div className="nav-cart">14 Cart</div>
          <button className="nav-login"><IconUser /> Login</button>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-avatar">E</div>
            <div className="sidebar-name">Ema</div>
          </div>

          <ul className="sidebar-nav">
            {navItems.map(item => (
              <li key={item.id}>
                <a className={item.id === "points" ? "active" : ""}>
                  {item.icon} {item.label}
                </a>
              </li>
            ))}
          </ul>

          <hr className="sidebar-divider" />

          <div className="sidebar-bottom">
            <a className="sidebar-link"><IconLogout /> Cerrar sesión</a>
            <a className="sidebar-link"><IconHelp /> Centro de ayuda</a>
          </div>
        </aside>

        <main className="main">
          <h1 className="main-title">Puntos de fidelidad</h1>

          <div className="loyalty-card">
            <div className="card-tag">
              <div className="card-tag-hole" />
              <div className="card-tag-logo">Tienda<br />la 635</div>
            </div>

            <div className="card-top">
              <div className="card-name">Andrés Emanuel</div>
              <div className="card-points-label">Puntos 20</div>
            </div>

            <div className="card-bottom">
              <div className="card-progress-label">50% más y conseguirás 20 puntos más!!!</div>
              <div className="card-progress-bar">
                <div className="card-progress-fill" />
              </div>
              <div className="card-expiry">Vence: <strong>15/06</strong></div>
            </div>
          </div>

          <div className="faq">
            {faqs.map((faq, i) => (
              <div key={i}>
                <div className="faq-question">{faq.q}</div>
                <div className="faq-answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}