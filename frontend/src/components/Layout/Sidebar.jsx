import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { DUR, EASE_OUT } from '../../utils/motion';

/*
 * Sidebar — el menú del panel.
 *
 * Dos niveles: arriba lo del día a día (Dashboard, Pedidos, Inventario) y
 * debajo tres grupos que se despliegan. Toda la decisión de qué va dónde y
 * qué está abierto vive en useSidebarNav; aquí solo se pinta.
 */
const Sidebar = () => {
  const { pathname } = useLocation();
  const { palette } = useTheme();
  const c = palette.colors;
  const { accesos, grupos, esActivo, tieneActivo, estaAbierto, alternar } = useSidebarNav();

  // Una sola pinta para todo lo clickeable del menú.
  const estilo = (activo) => ({
    color: activo ? c.primary : c.sidebarText,
    backgroundColor: activo ? c.primaryLight : 'transparent',
  });

  const fila = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full';

  return (
    <aside
      className="w-64 h-screen flex flex-col fixed left-0 top-0 transition-colors duration-300"
      style={{ backgroundColor: c.sidebarBg, borderRight: `1px solid ${c.sidebarBorder}` }}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold leading-none tracking-tight" style={{ color: c.textPrimary }}>
          Tienda<br />la 635
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {/* Lo de todos los días, sin un clic de más */}
        {accesos.map((item) => {
          const activo = esActivo(item.path);
          return (
            <Link key={item.path} to={item.path} className={fila} style={estilo(activo)}>
              <item.icon className="w-5 h-5" style={{ color: activo ? c.primary : c.textMuted }} />
              {item.name}
              {activo && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }} />}
            </Link>
          );
        })}

        {grupos.map((grupo) => {
          const abierto = estaAbierto(grupo);
          const conActivo = tieneActivo(grupo);

          return (
            <div key={grupo.id}>
              <button
                type="button"
                onClick={() => alternar(grupo)}
                aria-expanded={abierto}
                className={fila}
                /*
                 * El encabezado se tiñe solo si el grupo está cerrado y adentro
                 * hay algo activo: así se sabe dónde quedó uno sin abrirlo. Si
                 * está abierto, el color se lo lleva la pantalla de adentro y
                 * no compiten dos cosas resaltadas a la vez.
                 */
                style={estilo(conActivo && !abierto)}
              >
                <grupo.icon
                  className="w-5 h-5"
                  style={{ color: conActivo && !abierto ? c.primary : c.textMuted }}
                />
                {grupo.name}
                <ChevronDown
                  className="w-4 h-4 ml-auto transition-transform"
                  style={{
                    color: c.textMuted,
                    transform: abierto ? 'rotate(180deg)' : 'none',
                  }}
                />
              </button>

              <AnimatePresence initial={false}>
                {abierto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: DUR.dropdown, ease: EASE_OUT }}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* La guía de la izquierda ata visualmente el grupo con sus hijos */}
                    <div className="ml-6 pl-3 mt-1 space-y-1" style={{ borderLeft: `1px solid ${c.sidebarBorder}` }}>
                      {grupo.items.map((item) => {
                        const activo = esActivo(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                            style={estilo(activo)}
                          >
                            <item.icon className="w-4 h-4" style={{ color: activo ? c.primary : c.textMuted }} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: `1px solid ${c.sidebarBorder}` }}>
        <Link to="/cuenta" className={fila} style={estilo(pathname === '/cuenta')}>
          <Settings className="w-5 h-5" style={{ color: pathname === '/cuenta' ? c.primary : c.textMuted }} />
          Cuenta
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
