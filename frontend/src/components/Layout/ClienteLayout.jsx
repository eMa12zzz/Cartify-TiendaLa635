import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, MapPin, CreditCard, Bell, Star, Receipt, HelpCircle, LogOut, Heart, SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../hooks/useClientTheme';
import { useAuth } from '../../hooks/useAuth';
import HeaderTienda from '../Store/HeaderTienda';
import { useIdioma } from '../../hooks/useIdioma';

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
  { to: '/mi-cuenta/preferencias',   label: 'Preferencias',   titulo: 'Apariencia e idioma',   icon: SlidersHorizontal, ready: true },
];

const ClienteLayout = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { logout } = useAuth();
  const { t } = useIdioma();
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  /*
   * Mi Cuenta es SOLO del cliente.
   *
   * Aquí vivía también el Reparto del personal: quien entraba con su cuenta de
   * empleado veía solo esa pestaña (primero con un interruptor, "Estoy
   * trabajando", y después según el tipo de cuenta). Se fue a la app, que es
   * donde se reparte: el GPS, la pantalla encendida y la app de mapas están en
   * el teléfono. En la web el personal entra al panel por /admin (ver
   * "¿Trabajas en la tienda?" en LoginClient).
   */

  /*
   * Al cerrar sesión se queda EN la tienda, no en un formulario de login.
   * Salirse de la cuenta no es salirse del negocio: la mayoría sigue viendo
   * precios un rato más.
   */
  const handleLogout = () => {
    // Solo la del cliente: la del panel, si la misma persona la tiene abierta, sigue.
    logout('cliente');
    navigate('/');
  };

  /*
   * El sombreado al pasar el mouse se fue con el menú lateral: en pestañas
   * horizontales el subrayado ya dice cuál está activa, y pintarles el fondo
   * encima las volvía botones apretados uno contra otro.
   */

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.mainBg, color: c.textPrimary }}>
      {/*
        ── Barra superior ──
        La MISMA de la tienda. Antes Mi Cuenta tenía una barra propia —nombre,
        foto y "Ir a la tienda"— y era la única pantalla del cliente sin
        buscador ni carrito: entrar a la cuenta se sentía como salirse del
        negocio, y para volver a comprar había que buscar la salida. Con
        HeaderTienda el carrito y el buscador siguen donde siempre (llevan a la
        tienda, igual que en Impresiones).
      */}
      <HeaderTienda />

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
          {/*
            La vuelta a comprar, primera y siempre a la vista. Con el
            encabezado de la tienda arriba parecía que ya no hacía falta, pero
            ahí el nombre abre los pasillos (no lleva a la tienda) y el
            buscador y el carrito solo llevan de rebote: no había un "volver"
            que se viera como tal.
          */}
          <Link
            to="/"
            title={t('Volver a la tienda')}
            className="flex items-center gap-1.5 pl-1 pr-3 py-3 text-[13.5px] font-bold whitespace-nowrap transition-colors"
            style={{ color: c.primary }}
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> {t('Ir a la tienda')}
          </Link>
          <span className="w-px h-5 mr-1 flex-shrink-0" style={{ backgroundColor: c.cardBorder }} aria-hidden="true" />

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            // Ítems aún no cableados: visibles pero deshabilitados.
            if (!item.ready) {
              return (
                <div
                  key={item.to}
                  title={t('Próximamente')}
                  className="flex items-center gap-2 px-3 py-3 text-sm whitespace-nowrap cursor-not-allowed opacity-50"
                  style={{ color: c.textMuted }}
                >
                  <Icon className="w-4 h-4" /> {t(item.label)}
                </div>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                title={t(item.titulo || item.label)}
                className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors relative"
                style={{
                  color: active ? c.primary : c.textSecondary,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" /> {t(item.label)}
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
            title={t('Centro de ayuda')}
            className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors"
            style={{
              color: location.pathname === '/mi-cuenta/ayuda' ? c.primary : c.textSecondary,
              fontWeight: location.pathname === '/mi-cuenta/ayuda' ? 700 : 500,
            }}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" /> {t('Ayuda')}
          </Link>

          {/* Cerrar sesión pide confirmación: es la única acción del menú que
              te saca de la aplicación. */}
          <button
            onClick={() => setConfirmarSalida(true)}
            title={t('Cerrar sesión')}
            className="flex items-center gap-1.5 px-2.5 py-3 text-[13.5px] whitespace-nowrap transition-colors"
            style={{ color: c.textSecondary }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" /> {t('Salir')}
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
              style={{ backgroundColor: c.cardBg || 'var(--papel)', color: c.textPrimary }}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: c.primaryLight, color: c.primary }}
              >
                <LogOut className="h-5 w-5" />
              </div>
              <h2 className="mb-1 text-center text-lg font-bold">{t('¿Cerrar sesión?')}</h2>
              <p className="mb-6 text-center text-sm" style={{ color: c.textSecondary }}>
                {t('Tendrá que volver a ingresar su correo y contraseña para entrar de nuevo.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarSalida(false)}
                  className="press flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: c.primaryLight, color: c.textPrimary }}
                >
                  {t('Quedarme')}
                </button>
                <button
                  onClick={handleLogout}
                  className="press flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: c.primary }}
                >
                  {t('Cerrar sesión')}
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
