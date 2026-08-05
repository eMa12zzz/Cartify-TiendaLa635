import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, MapPin, CreditCard, Bell, Star, Receipt, HelpCircle, LogOut, Store, Heart, Bike,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../hooks/useClientTheme';
import { useAuth } from '../../hooks/useAuth';
import { puedeRepartir } from '../../hooks/useReparto';
import { useAjustesCtx } from '../../context/AjustesContext';

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
/*
 * `label` es el nombre corto que se ve en la barra; `titulo` es el largo, que
 * queda como ayuda al dejar el cursor encima.
 *
 * En vertical cabía "Detalles de la Cuenta" completo, pero en horizontal esos
 * nombres largos empujaban las últimas secciones fuera de la pantalla y había
 * que deslizar para descubrir que existían. Un menú que esconde la mitad de
 * sus opciones es medio menú.
 */
const navItems = [
  { to: '/mi-cuenta',                label: 'Mis datos',      titulo: 'Detalles de la cuenta', icon: User,        ready: true },
  { to: '/mi-cuenta/pedidos',        label: 'Pedidos',        titulo: 'Mis pedidos',           icon: ShoppingBag, ready: true },
  { to: '/mi-cuenta/favoritos',      label: 'Favoritos',      titulo: 'Mis favoritos',         icon: Heart,       ready: true },
  { to: '/mi-cuenta/direcciones',    label: 'Direcciones',    titulo: 'Direcciones de entrega',icon: MapPin,      ready: true },
  { to: '/mi-cuenta/pagos',          label: 'Pagos',          titulo: 'Métodos de pago',       icon: CreditCard,  ready: true },
  { to: '/mi-cuenta/notificaciones', label: 'Avisos',         titulo: 'Notificaciones',        icon: Bell,        ready: true },
  { to: '/mi-cuenta/puntos',         label: 'Puntos',         titulo: 'Puntos de fidelidad',   icon: Star,        ready: true },
  { to: '/mi-cuenta/recibidos',      label: 'Recibos',        titulo: 'Recibos',               icon: Receipt,     ready: true },
];

const ClienteLayout = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { user, logout } = useAuth();
  const { ajustes } = useAjustesCtx();
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const displayName = user?.userName || user?.fullName || 'Cliente';
  const initials = displayName.substring(0, 1).toUpperCase();
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  /*
   * "Reparto" solo lo ve el personal. Va de primero porque para ellos es lo
   * único que vienen a hacer aquí: el resto del menú es de su cuenta personal.
   */
  const items = puedeRepartir(user)
    ? [{ to: '/mi-cuenta/reparto', label: 'Reparto', icon: Bike, ready: true }, ...navItems]
    : navItems;

  /*
   * Al cerrar sesión se queda EN la tienda, no en un formulario de login.
   * Salirse de la cuenta no es salirse del negocio: la mayoría sigue viendo
   * precios un rato más.
   */
  const handleLogout = () => {
    /*
     * Se cierra el cajón de QUIEN está dentro, no el que adivine la ruta.
     *
     * Sin esto, un repartidor —que entra con cuenta de empleado y trabaja
     * desde /mi-cuenta/reparto— tocaba "Cerrar sesión", leía que tendría que
     * volver a ingresar su contraseña… y no se cerraba nada: el área de
     * /mi-cuenta es la de CLIENTE, así que se borraba un cajón vacío mientras
     * su token de personal seguía vivo. En un teléfono que se usa en la calle
     * eso deja abierto el panel entero. Ver AuthContext.
     */
    logout(user?.type === 'client' ? 'cliente' : 'personal');
    navigate('/');
  };

  /*
   * El sombreado al pasar el mouse se fue con el menú lateral: en pestañas
   * horizontales el subrayado ya dice cuál está activa, y pintarles el fondo
   * encima las volvía botones apretados uno contra otro.
   */

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.mainBg, color: c.textPrimary }}>
      {/* ── Barra superior ── */}
      <nav
        className="h-14 px-6 flex items-center justify-between"
        style={{ backgroundColor: c.topbarBg, borderBottom: `1px solid ${c.sidebarBorder}` }}
      >
        <Link to="/store" className="font-bold leading-none text-sm" style={{ color: c.textPrimary }}>
          {/* El nombre sale de los ajustes, no del código: la Fase 4 lo hizo
              editable y esta pantalla se había quedado con el de siempre. */}
          {ajustes.nombreLinea1}<br />{ajustes.nombreLinea2}
        </Link>

        {/* Quién está dentro. Se mudó del menú lateral a aquí: ahora que la
            navegación es horizontal, este es el único lugar donde el dato
            cabe sin robarle sitio a las secciones. */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: c.primary, color: c.buttonText }}
            >
              {initials}
            </div>
            <span className="text-sm font-semibold truncate max-w-[160px]" style={{ color: c.textPrimary }}>
              {displayName}
            </span>
          </div>

          <Link
            to="/store"
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors"
            style={{ border: `1px solid ${c.sidebarBorder}`, color: c.textSecondary }}
          >
            <Store className="w-4 h-4" /> Ir a la tienda
          </Link>
        </div>
      </nav>

      {/*
        ── Cuerpo: sidebar + contenido ──
        El menú va ARRIBA, en horizontal, y el contenido al centro con aire a
        los lados.

        Con el menú de lado, cada página arrancaba corrida a la derecha y el
        ojo tenía que saltar la columna del menú antes de llegar a lo que
        venía a ver. Arriba se recorre de un vistazo —son ocho secciones, no
        cuarenta— y deja la pantalla entera para el contenido.
      */}
      {/*
        Sin raya abajo: la barra de arriba ya trae la suya, y dos líneas
        paralelas a pocos píxeles una de otra dejaban el menú metido en una
        franja aparte en vez de leerse como parte de la página.
      */}
      <div className="px-4 sm:px-6" style={{ backgroundColor: c.topbarBg }}>
        {/*
          Deslizable en pantalla chica: en un teléfono no caben ocho pestañas,
          y partirlas en dos filas movía el contenido hacia abajo cada vez.
        */}
        <nav
          className="flex items-center gap-1 overflow-x-auto max-w-6xl mx-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            // Ítems aún no cableados: visibles pero deshabilitados.
            if (!item.ready) {
              return (
                <div
                  key={item.to}
                  title="Próximamente"
                  className="flex items-center gap-2 px-3 py-3 text-sm whitespace-nowrap cursor-not-allowed opacity-50"
                  style={{ color: c.textMuted }}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </div>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.titulo || item.label}
                className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors relative"
                style={{
                  color: active ? c.primary : c.textSecondary,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                {/* La rayita de abajo: dice dónde está uno sin pintar toda la
                    pestaña, que en horizontal se ve pesado */}
                {active && (
                  <span
                    className="absolute left-2 right-2 bottom-0 h-[3px] rounded-t"
                    style={{ backgroundColor: c.primary }}
                  />
                )}
              </Link>
            );
          })}

          {/* Ayuda y salir se van al final, separados: no son secciones de la
              cuenta sino cosas que se hacen desde ella. */}
          <span className="flex-1 min-w-[8px]" />

          <Link
            to="/mi-cuenta/ayuda"
            title="Centro de ayuda"
            className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors"
            style={{
              color: location.pathname === '/mi-cuenta/ayuda' ? c.primary : c.textSecondary,
              fontWeight: location.pathname === '/mi-cuenta/ayuda' ? 700 : 500,
            }}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" /> Ayuda
          </Link>

          {/* Cerrar sesión pide confirmación: es la única acción del menú que
              te saca de la aplicación. */}
          <button
            onClick={() => setConfirmarSalida(true)}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors"
            style={{ color: c.textSecondary }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" /> Salir
          </button>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {/* Contenido de la página activa */}
        <main
          className="min-w-0 rounded-2xl p-6 sm:p-8"
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
