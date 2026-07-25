import { useTheme } from '../../hooks/useClientTheme';
import { useNotifications } from '../../hooks/useNotifications';

/*
 * Notificaciones — el cliente activa/desactiva sus avisos (área "Mi Cuenta").
 * La lógica vive en useNotifications; aquí solo pintamos los interruptores.
 */

// Interruptor tipo "switch" reutilizable, temeable.
const Toggle = ({ on, onClick, colors }) => (
  <button
    onClick={onClick}
    role="switch"
    aria-checked={on}
    className="relative w-11 h-6 rounded-full transition-colors flex-none"
    style={{ backgroundColor: on ? colors.primary : colors.cardBorder }}
  >
    <span
      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
      style={{ left: on ? '22px' : '2px' }}
    />
  </button>
);

const opciones = [
  { clave: 'promociones',     titulo: 'Promociones nuevas',        sub: 'Avísame de ofertas y descuentos.' },
  { clave: 'nuevosProductos', titulo: 'Productos nuevos',          sub: 'Avísame cuando lleguen productos.' },
  { clave: 'pedidoCerca',     titulo: 'Mi pedido va en camino',    sub: 'Avísame cuando mi pedido esté cerca.' },
];

const Notificaciones = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { prefs, loading, toggle } = useNotifications();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Notificaciones</h1>

      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus preferencias…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {opciones.map((op) => (
            <div
              key={op.clave}
              className="flex items-center justify-between gap-4 p-4 rounded-xl"
              style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: c.textPrimary }}>{op.titulo}</div>
                <div className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{op.sub}</div>
              </div>
              <Toggle on={!!prefs[op.clave]} onClick={() => toggle(op.clave)} colors={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
