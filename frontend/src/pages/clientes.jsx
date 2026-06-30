import { useState } from "react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "inventario", label: "Inventario", icon: "📋", badge: true },
  { id: "pedidos", label: "Pedidos", icon: "🛍️" },
  { id: "proveedores", label: "Proveedores", icon: "🤝" },
  { id: "marcas", label: "Marcas", icon: "🏷️" },
  { id: "empleados", label: "Empleados", icon: "👥" },
  { id: "clientes", label: "Clientes", icon: "👤" },
  { id: "categorias", label: "Categorías", icon: "📁" },
  { id: "modulos", label: "Módulos", icon: "🔲" },
];

const clientesData = [
  { nombre: "Richard Martín", telefono: "5555-5555", direccion: "43 Street", correo: "richard@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Tom Homan", telefono: "5555-5555", direccion: "43 Street", correo: "tomhoman@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Veandir", telefono: "5555-5555", direccion: "43 Street", correo: "veandir@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "No activo" },
  { nombre: "Charln", telefono: "5555-5555", direccion: "43 Street", correo: "charln@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Hoffman", telefono: "5555-5555", direccion: "43 Street", correo: "hoffman@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Fainden Juke", telefono: "5555-5555", direccion: "43 Street", correo: "fainden@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "No activo" },
  { nombre: "Martin", telefono: "5555-5555", direccion: "43 Street", correo: "martin@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Joe Nike", telefono: "5555-5555", direccion: "43 Street", correo: "joenike@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Dender Luke", telefono: "5555-5555", direccion: "43 Street", correo: "dender@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Martin", telefono: "5555-5555", direccion: "43 Street", correo: "martin@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Joe Nike", telefono: "5555-5555", direccion: "43 Street", correo: "joenike@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
  { nombre: "Dender Luke", telefono: "5555-5555", direccion: "43 Street", correo: "dender@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "No activo" },
  { nombre: "Joe Nike", telefono: "5555-5555", direccion: "43 Street", correo: "joenike@gmail.com", dui: "012345678-9", usuario: "Elpepe", verificado: "Verificado", puntos: 50, estatus: "Activo" },
];

const styles = {
  root: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: "13px",
    backgroundColor: "#f5f5f5",
  },
  sidebar: {
    width: "160px",
    minWidth: "160px",
    backgroundColor: "#fff",
    borderRight: "1px solid #e8e8e8",
    display: "flex",
    flexDirection: "column",
  },
  sidebarLogo: {
    padding: "20px 16px 16px",
    borderBottom: "1px solid #eee",
  },
  logoText: {
    fontWeight: "700",
    fontSize: "15px",
    lineHeight: "1.2",
    color: "#1a1a1a",
  },
  sidebarNav: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 16px",
    cursor: "pointer",
    color: "#555",
    fontSize: "13px",
    position: "relative",
  },
  navItemActive: {
    color: "#c8923a",
    fontWeight: "600",
    backgroundColor: "#fdf5ec",
  },
  navIcon: {
    fontSize: "15px",
    width: "18px",
    textAlign: "center",
  },
  badge: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#c8923a",
    marginLeft: "2px",
  },
  sidebarFooter: {
    borderTop: "1px solid #eee",
    padding: "8px 0",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topbar: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e8e8e8",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#f5e6d0",
    borderRadius: "20px",
    padding: "7px 16px",
    width: "220px",
    color: "#a0794a",
    fontSize: "12px",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#555",
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#c8923a",
    marginBottom: "20px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "12px",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    color: "#444",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #ebebeb",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "11.5px",
    color: "#888",
    fontWeight: "600",
    borderBottom: "1px solid #f0f0f0",
    backgroundColor: "#fafafa",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "9px 14px",
    borderBottom: "1px solid #f5f5f5",
    color: "#333",
    fontSize: "12.5px",
  },
  statusActivo: {
    color: "#22a55a",
    fontWeight: "600",
    fontSize: "12px",
  },
  statusNoActivo: {
    color: "#e04c2a",
    fontWeight: "600",
    fontSize: "12px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 4px 0",
  },
  btnPage: {
    padding: "6px 16px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    color: "#444",
  },
  pageInfo: {
    color: "#888",
    fontSize: "12px",
  },
};

export default function Clientes() {
  const [activeNav, setActiveNav] = useState("clientes");

  return (
    <div style={styles.root}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoText}>Tienda<br />la 635</div>
        </div>
        <nav style={styles.sidebarNav}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.navItem,
                ...(activeNav === item.id ? styles.navItemActive : {}),
              }}
              onClick={() => setActiveNav(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span style={styles.badge} />}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>⚙️</span>
            <span>Cuenta</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div style={styles.searchBox}>
            <span>🔍</span>
            <span>Search for anything...</span>
          </div>
          <div style={styles.userArea}>
            <div>
              <div style={{ fontWeight: "600", textAlign: "right" }}>Ema PesoPlumaб9</div>
              <div style={{ color: "#aaa", fontSize: "11px", textAlign: "right" }}>SV</div>
            </div>
            <div style={styles.avatar}>E</div>
            <span style={{ color: "#bbb", fontSize: "10px" }}>▼</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          <div style={styles.pageTitle}>Clientes</div>

          <div style={styles.toolbar}>
            <button style={styles.btnOutline}>⚙ Filtros</button>
            <button style={styles.btnOutline}>⬇ Descargar todo</button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Número de Teléfono</th>
                  <th style={styles.th}>Dirección</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>DUI</th>
                  <th style={styles.th}>Nombre de Usuario</th>
                  <th style={styles.th}>Verificado</th>
                  <th style={styles.th}>Puntos</th>
                  <th style={styles.th}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {clientesData.map((c, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
                    <td style={styles.td}>{c.nombre}</td>
                    <td style={styles.td}>{c.telefono}</td>
                    <td style={styles.td}>{c.direccion}</td>
                    <td style={styles.td}>{c.correo}</td>
                    <td style={styles.td}>{c.dui}</td>
                    <td style={styles.td}>{c.usuario}</td>
                    <td style={styles.td}>{c.verificado}</td>
                    <td style={styles.td}>{c.puntos}</td>
                    <td style={styles.td}>
                      <span style={c.estatus === "Activo" ? styles.statusActivo : styles.statusNoActivo}>
                        {c.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button style={styles.btnPage}>Anterior</button>
            <span style={styles.pageInfo}>Página 1 de 10</span>
            <button style={styles.btnPage}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}