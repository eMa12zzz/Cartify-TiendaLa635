import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../hooks/useClientTheme';
import { useMyOrders } from '../../hooks/useMyOrders';
import { orderService } from '../../api/orderService';
import CodigoEntrega from '../../components/Store/CodigoEntrega';

/*
 * MisPedidos — historial de pedidos del cliente (área "Mi Cuenta").
 * Migrada de mockup a datos reales (modelo Order). La lógica de carga vive en
 * useMyOrders; aquí solo pintamos la lista de tarjetas de pedido.
 */

/*
 * Valoración del SERVICIO de entrega (no del producto). Sale solo en los
 * pedidos a domicilio ya entregados: es cuando de verdad hubo un reparto que
 * juzgar. Una vez enviada, se muestra de solo lectura.
 */
const ValoracionServicio = ({ order, c }) => {
  const [sel, setSel] = useState(order.serviceRating?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState(order.serviceRating?.comment || '');
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(!!order.serviceRating?.rating);

  const mostradas = guardado ? sel : (hover || sel);

  const enviar = async () => {
    if (!sel) { toast('Elegí de 1 a 5 estrellas'); return; }
    setEnviando(true);
    try {
      await orderService.rateService(order._id, { rating: sel, comment: comentario });
      setGuardado(true);
      toast.success('¡Gracias por valorar el servicio!');
    } catch {
      // El aviso de error ya lo pinta el interceptor de axios.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ borderTop: `1px solid ${c.cardBorder}`, paddingTop: 12, marginTop: 12 }}>
      <div className="text-xs font-bold mb-1.5" style={{ color: c.textPrimary }}>
        {guardado ? 'Valoraste el servicio de entrega' : '¿Qué tal estuvo la entrega?'}
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const activa = mostradas >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={guardado || enviando}
              onMouseEnter={() => { if (!guardado) setHover(n); }}
              onMouseLeave={() => setHover(0)}
              onClick={() => setSel(n)}
              aria-label={`${n} de 5`}
              style={{ background: 'none', border: 'none', padding: 2, cursor: guardado ? 'default' : 'pointer' }}
            >
              <Star className="w-5 h-5" style={{ color: activa ? '#f5a623' : c.textMuted, fill: activa ? '#f5a623' : 'none' }} />
            </button>
          );
        })}
      </div>

      {!guardado ? (
        <>
          <textarea
            rows={2}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Algo que contar del reparto? (opcional)"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none mb-2"
            style={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }}
          />
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="px-5 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-60"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            {enviando ? 'Enviando…' : 'Enviar valoración'}
          </button>
        </>
      ) : (
        comentario && <p className="text-sm" style={{ color: c.textSecondary }}>“{comentario}”</p>
      )}
    </div>
  );
};

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
  const navigate = useNavigate();
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

                {/*
                  El código de entrega, en pequeño. En la lista va la versión
                  compacta y no la tarjeta entera: aquí solo hace falta poder
                  encontrarlo rápido —el cliente ya está en la puerta con el
                  teléfono en la mano—, y el componente se calla solo en los
                  pedidos ya entregados o cancelados.
                */}
                {order.deliveryCode && (
                  <div className="mb-3">
                    <CodigoEntrega
                      codigo={order.deliveryCode}
                      deliveryType={order.deliveryType}
                      estado={order.status}
                      compacto
                    />
                  </div>
                )}

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

                {/* Ver el estado del pedido en su propia pantalla (línea de
                    tiempo, envío, y el mapa en vivo si va en camino). */}
                <button
                  type="button"
                  onClick={() => navigate(`/mi-cuenta/pedido/${order._id}`)}
                  className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={{ border: `1px solid ${c.cardBorder}`, color: c.primary, background: 'transparent' }}
                >
                  Ver estado del pedido <ChevronRight className="w-4 h-4" />
                </button>

                {/* Valorar el servicio: solo en domicilios ya entregados. */}
                {order.deliveryType === 'delivery' && order.status === 'entregado' && (
                  <ValoracionServicio order={order} c={c} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
