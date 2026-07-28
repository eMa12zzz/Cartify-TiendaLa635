import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, MapPin, CreditCard, Bell, Star, Receipt, HelpCircle, LogOut, Store, Heart,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../hooks/useClientTheme';
import { useAuth } from '../../hooks/useAuth';

/*
 * ClienteLayout — el "marco" compartido del área "Mi Cuenta" del cliente.
 *
 * Antes cada página del cliente repetía su propio nav + sidebar inline. Ahora
 * viven aquí una sola vez y cada página solo coloca su contenido en <Outlet />.
 * Usa el tema (ThemeContext), así que también se adapta a las paletas de
 * accesibilidad — útil para el público de la tienda.
 *
 * `ready` marca los ítems ya cableados; los demás se muestran deshabilitados
 * ("Pronto") mientras se conectan en los siguientes pasos de la Fase 1.
 */
const navItems = [
  { to: '/mi-cuenta',                label: 'Detalles de la Cuenta', icon: User,        ready: true  },
  { to: '/mi-cuenta/pedidos',        label: 'Mis pedidos',           icon: ShoppingBag, ready: true  },
  { to: '/mi-cuenta/favoritos',      label: 'Mis favoritos',         icon: Heart,       ready: true  },
  { to: '/mi-cuenta/direcciones',    label: 'Direcciones',           icon: MapPin,      ready: true  },
  { to: '/mi-cuenta/pagos',          label: 'Métodos de pago',       icon: CreditCard,  ready: true  },
  { to: '/mi-cuenta/notificaciones', label: 'Notificaciones',        icon: Bell,        ready: true  },
  { to: '/mi-cuenta/puntos',         label: 'Puntos de fidelidad',   icon: Star,        ready: true  },
  { to: '/mi-cuenta/recibidos',      label: 'Recibos',               icon: Receipt,     ready: true  },
];

const ClienteLayout = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const displayName = user?.userName || user?.fullName || 'Cliente';
  const initials = displayName.substring(0, 1).toUpperCase();
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /*
   * Sombreado al pasar el mouse. Se hace tocando el estilo del elemento en vez
   * de con estado de React porque los colores vienen del tema elegido y no de
   * clases de Tailwind: un :hover en CSS no sabría qué color usar, y meter
   * estado por cada fila del menú re-renderiza el sidebar entero al mover el
   * mouse.
   */
  const sombrear = (e) => { e.currentTarget.style.backgroundColor = c.primaryLight; };
  const desSombrear = (activo) => (e) => {
    e.currentTarget.style.backgroundColor = activo ? c.primaryLight : 'transparent';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.mainBg, color: c.textPrimary }}>
      {/* ── Barra superior ── */}
      <nav
        className="h-14 px-6 flex items-center justify-between"
        style={{ backgroundColor: c.topbarBg, borderBottom: `1px solid ${c.sidebarBorder}` }}
      >
        <div className="font-bold leading-none text-sm" style={{ color: c.textPrimary }}>
          Tienda<br />la 635
        </div>
        <Link
          to="/store"
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors"
          style={{ border: `1px solid ${c.sidebarBorder}`, color: c.textSecondary }}
        >
          <Store className="w-4 h-4" /> Ir a la tienda
        </Link>
      </nav>

      {/* ── Cuerpo: sidebar + contenido ── */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 px-4 py-6">
        <aside className="w-full md:w-56 flex-shrink-0">
          {/* Encabezado del usuario */}
          <div className="flex items-center gap-3 mb-5 px-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: c.primary, color: c.buttonText }}
            >
              {initials}
            </div>
            <div className="text-sm font-semibold truncate" style={{ color: c.textPrimary }}>
              {displayName}
            </div>
          </div>

          {/* Navegación de la cuenta */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;

              // Ítems aún no cableados: visibles pero deshabilitados.
              if (!item.ready) {
                return (
                  <div
                    key={item.to}
                    title="Próximamente"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-50"
                    style={{ color: c.textMuted }}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                    <span
                      className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: c.cardBorder, color: c.textSecondary }}
                    >
                      Pronto
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    color: active ? c.primary : c.textSecondary,
                    backgroundColor: active ? c.primaryLight : 'transparent',
                  }}
                  onMouseEnter={sombrear}
                  onMouseLeave={desSombrear(active)}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              );
            })}
          </nav>

          <hr className="my-3" style={{ borderColor: c.sidebarBorder }} />

          <div className="flex flex-col gap-0.5">
            {/* Cerrar sesión pide confirmación: es la única acción del menú
                que te saca de la aplicación. */}
            <button
              onClick={() => setConfirmarSalida(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left"
              style={{ color: c.textSecondary, backgroundColor: 'transparent' }}
              onMouseEnter={sombrear}
              onMouseLeave={desSombrear(false)}
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
            <Link
              to="/mi-cuenta/ayuda"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: location.pathname === '/mi-cuenta/ayuda' ? c.primary : c.textSecondary,
                backgroundColor: location.pathname === '/mi-cuenta/ayuda' ? c.primaryLight : 'transparent',
              }}
            >
              <HelpCircle className="w-4 h-4" /> Centro de ayuda
            </Link>
          </div>
        </aside>

        {/* Contenido de la página activa */}
        <main
          className="flex-1 rounded-2xl p-7"
          style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
        >
          {/* Transición sutil entre páginas del cliente (criterio de Emil) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Confirmación de cierre de sesión */}
      <AnimatePresence>
        {confirmarSalida && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 bg-black/45"
              onClick={() => setConfirmarSalida(false)}
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: c.cardBg || '#fff', color: c.textPrimary }}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: c.primaryLight, color: c.primary }}
              >
                <LogOut className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-center text-lg font-bold">¿Cerrar sesión?</h2>
              <p className="mb-6 text-center text-sm" style={{ color: c.textSecondary }}>
                Tendrá que volver a ingresar su correo y contraseña para entrar de nuevo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarSalida(false)}
                  className="press flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: c.primaryLight, color: c.textPrimary }}
                >
                  Quedarme
                </button>
                <button
                  onClick={handleLogout}
                  className="press flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: c.primary }}
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClienteLayout;
