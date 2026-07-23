import { Package, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useMyOrders } from '../../hooks/useMyOrders';

/*
 * MisPedidos — historial de pedidos del cliente (área "Mi Cuenta").
 * Migrada de mockup a datos reales (modelo Order). La lógica de carga vive en
 * useMyOrders; aquí solo pintamos la lista de tarjetas de pedido.
 */

// Colores de estado (semánticos, fijos — no cambian con la paleta para que el
// estado siempre se lea igual). Coinciden con los estados del modelo Order.
const estadoInfo = {
  pagado:     { label: 'Pagado',     color: '#2563eb', bg: 'rgba(37,99,235,.12)' },
  preparando: { label: 'Preparando', color: '#d97706', bg: 'rgba(217,119,6,.14)' },
  entregado:  { label: 'Entregado',  color: '#16a34a', bg: 'rgba(22,163,74,.14)' },
  cancelado:  { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,.12)' },
};

const formatFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MisPedidos = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { orders, loading } = useMyOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Mis pedidos</h1>

      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus pedidos…</p>
      ) : orders.length === 0 ? (
        // Estado vacío: una invitación, no una disculpa.
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>Aún no tienes pedidos</p>
          <p className="text-sm" style={{ color: c.textSecondary }}>Cuando compres en la tienda, tus pedidos aparecerán aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const estado = estadoInfo[order.status] || estadoInfo.pagado;
            return (
              <div
                key={order._id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
              >
                {/* Encabezado del pedido */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="text-sm font-bold" style={{ color: c.textPrimary }}>
                      Pedido #{String(order._id).slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs" style={{ color: c.textMuted }}>{formatFecha(order.createdAt)}</div>
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ color: estado.color, backgroundColor: estado.bg }}
                  >
                    {estado.label}
                  </span>
                </div>

                {/* Productos del pedido */}
                <div className="flex flex-col gap-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: c.textSecondary }}>
                        {item.amount}× {item.name || item.productId?.name || 'Producto'}
                      </span>
                      <span style={{ color: c.textSecondary }}>
                        ${(item.price * item.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pie: puntos ganados + total */}
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: `1px solid ${c.cardBorder}` }}
                >
                  {order.pointsEarned > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: c.accent }}>
                      <Star className="w-3.5 h-3.5" /> +{order.pointsEarned} puntos
                    </span>
                  ) : <span />}
                  <span className="text-base font-bold" style={{ color: c.textPrimary }}>
                    Total: ${Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
