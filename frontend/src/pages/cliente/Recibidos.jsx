import { Receipt, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useMyOrders } from '../../hooks/useMyOrders';

/*
 * Recibidos — "Recibos": los pedidos ya ENTREGADOS del cliente, como
 * comprobante de compra. Reutiliza useMyOrders filtrando por estado 'entregado'.
 */

const formatFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Recibidos = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { orders, loading } = useMyOrders('entregado');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Recibos</h1>

      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus recibos…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>Todavía no hay recibos</p>
          <p className="text-sm" style={{ color: c.textSecondary }}>Aquí verás el comprobante de cada pedido que ya recibiste.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: c.textPrimary }}>
                    Recibo #{String(order._id).slice(-6).toUpperCase()}
                  </div>
                  <div className="text-xs" style={{ color: c.textMuted }}>{formatFecha(order.createdAt)}</div>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#16a34a' }}>
                  <CheckCircle2 className="w-4 h-4" /> Entregado
                </span>
              </div>

              <div className="flex flex-col gap-1 mb-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span style={{ color: c.textSecondary }}>
                      {item.amount}× {item.name || item.productId?.name || 'Producto'}
                    </span>
                    <span style={{ color: c.textSecondary }}>${(item.price * item.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: `1px solid ${c.cardBorder}` }}
              >
                <span className="text-xs" style={{ color: c.textMuted }}>
                  Pago: {order.paymentMethod || 'efectivo'}
                </span>
                <span className="text-base font-bold" style={{ color: c.textPrimary }}>
                  Total: ${Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recibidos;
