import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft, Package, ChefHat, Check, Bike, MapPin, CreditCard,
  Wallet, Banknote, Hash, Store as StoreFront, X,
} from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { orderService } from '../../api/orderService';
import { useSeguimientoEnVivo } from '../../hooks/useSeguimientoEnVivo';
import ValoracionPedido from '../../components/Store/ValoracionPedido';

/*
 * ============================================================
 * ESTADO DEL PEDIDO — la pantalla completa de "Orden en curso"
 * ============================================================
 * Lo que la burbuja muestra en pequeño, aquí en grande y con TODO: la línea de
 * tiempo, los productos, el resumen de cobro (con el envío real que ahora sí se
 * cobra) y, si va en camino, el mapa en vivo del repartidor.
 *
 * Todos los datos salen del pedido de verdad (orderService.getOrderById); no
 * hay nada inventado. Se llega desde "Mis pedidos" y desde la burbuja.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

/*
 * Los pasos del pedido, iguales que en la burbuja para que la persona vea lo
 * mismo en los dos lados. "En camino" se filtra abajo para retiro en local
 * —no hay repartidor que seguirle— así que ese solo ve tres.
 */
const PASOS_TODOS = [
  { id: 'pagado', label: 'Recibido', detalle: 'Su pedido entró a la tienda', Icono: Package },
  { id: 'preparando', label: 'Preparando', detalle: 'Están juntando sus productos', Icono: ChefHat },
  { id: 'en_camino', label: 'En camino', detalle: 'Un repartidor va para su casa', Icono: Bike },
  { id: 'entregado', label: 'Entregado', detalle: '¡Que lo disfrute!', Icono: Check },
];

// Cómo se nombra cada forma de pago de cara al cliente.
const PAGO = {
  efectivo: { label: 'Efectivo', Icono: Banknote },
  tarjeta: { label: 'Tarjeta', Icono: CreditCard },
  saldo: { label: 'Saldo / Gift card', Icono: Wallet },
};

const pinRepartidor = divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.22),0 2px 6px rgba(0,0,0,.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pinCasa = divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:${BROWN};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

// Encuadra el mapa para que se vean el repartidor y la casa a la vez.
const EncuadreDeViaje = ({ punto, destino }) => {
  const mapa = useMap();
  if (punto && destino) {
    mapa.fitBounds(latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
      padding: [34, 34], maxZoom: 16, animate: true,
    });
  } else if (punto) {
    mapa.setView([punto.lat, punto.lng], 15);
  }
  return null;
};

const formatFechaLarga = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-SV', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const EstadoPedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const c = palette.colors;

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        setCargando(true);
        const data = await orderService.getOrderById(id);
        if (vivo) setPedido(data);
      } catch {
        if (vivo) setError(true);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, [id]);

  // Seguimiento en vivo: solo tiene sentido mientras el pedido está en curso.
  const enCurso = pedido && ['pagado', 'preparando', 'en_camino'].includes(pedido.status);
  const seguimiento = useSeguimientoEnVivo(pedido?._id, !!enCurso);

  if (cargando) {
    return <p className="text-sm p-2" style={{ color: c.textSecondary }}>Cargando su pedido…</p>;
  }
  if (error || !pedido) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <X className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
        <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>No encontramos ese pedido</p>
        <button
          type="button"
          onClick={() => navigate('/mi-cuenta/pedidos')}
          className="mt-3 px-5 py-2 rounded-full text-sm font-bold"
          style={{ backgroundColor: c.primary, color: c.buttonText }}
        >
          Ver mis pedidos
        </button>
      </div>
    );
  }

  // El estado que manda es el más fresco: el del seguimiento si llegó, si no el
  // guardado del pedido.
  const estado = seguimiento.estado || pedido.status;
  const cancelado = estado === 'cancelado';
  const esDomicilio = pedido.deliveryType === 'delivery';
  const PASOS = esDomicilio ? PASOS_TODOS : PASOS_TODOS.filter((p) => p.id !== 'en_camino');
  const pasoActual = PASOS.findIndex((p) => p.id === estado);
  const estaEnCamino = estado === 'en_camino';
  const enCamino = estaEnCamino && seguimiento.enVivo;

  const numero = String(pedido._id).slice(-6).toUpperCase();
  const infoPago = PAGO[pedido.paymentMethod] || PAGO.efectivo;

  const subtotal = Number(pedido.subtotal ?? pedido.total ?? 0);
  const envio = Number(pedido.shippingCost || 0);
  const servicio = Number(pedido.serviceFee || 0);
  const descuento = Number(pedido.discount || 0);
  const total = Number(pedido.total || 0);

  const tarjeta = { backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 16 };

  return (
    <div className="pb-8">
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate('/mi-cuenta/pedidos')}
        className="inline-flex items-center gap-1 text-sm font-semibold mb-4"
        style={{ color: c.textSecondary }}
      >
        <ChevronLeft className="w-4 h-4" /> Mis pedidos
      </button>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
        {/* ── Columna izquierda: estado + productos ── */}
        <div className="flex flex-col gap-5" style={{ minWidth: 0 }}>
          <div style={tarjeta} className="p-6">
            {/* Chip de estado */}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3"
              style={{
                color: cancelado ? '#dc2626' : '#16a34a',
                backgroundColor: cancelado ? 'rgba(220,38,38,.12)' : 'rgba(22,163,74,.14)',
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: cancelado ? '#dc2626' : '#16a34a',
              }} />
              {cancelado ? 'Cancelado' : estado === 'entregado' ? 'Entregado' : 'En proceso'}
            </span>

            <h1 className="text-xl font-extrabold" style={{ color: c.textPrimary }}>
              {cancelado ? 'Pedido cancelado' : estado === 'entregado' ? 'Pedido entregado' : 'Orden en curso'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: c.textMuted }}>
              Pedido recibido el {formatFechaLarga(pedido.createdAt)}
            </p>

            {!cancelado && (
              <>
                {/* El círculo con el check, como en la confirmación */}
                <div className="flex flex-col items-center my-6">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: estado === 'entregado' ? '#22c55e' : BROWN }}
                  >
                    {estaEnCamino
                      ? <Bike className="w-7 h-7 text-white" />
                      : (() => { const I = (PASOS[pasoActual] || PASOS[0]).Icono; return <I className="w-7 h-7 text-white" />; })()}
                  </div>
                  <div className="text-base font-bold" style={{ color: c.textPrimary }}>
                    {enCamino
                      ? (seguimiento.yaCasi ? 'Ya casi llega a su puerta' : seguimiento.espera)
                      : (PASOS[pasoActual] || PASOS[0]).detalle}
                  </div>
                </div>

                {/* Línea de tiempo real (3 pasos) */}
                <div className="flex items-start">
                  {PASOS.map((p, i) => {
                    const activo = i <= pasoActual;
                    return (
                      <div key={p.id} className="flex-1 flex flex-col items-center relative">
                        {i < PASOS.length - 1 && (
                          <div
                            className="absolute h-0.5"
                            style={{
                              top: 6, left: '50%', right: '-50%',
                              background: i < pasoActual ? BROWN : c.cardBorder,
                            }}
                          />
                        )}
                        <div
                          className="w-3.5 h-3.5 rounded-full mb-1.5 relative z-10"
                          style={{ background: activo ? BROWN : c.cardBorder }}
                        />
                        <div
                          className="text-xs text-center"
                          style={{ color: activo ? BROWN : c.textMuted, fontWeight: activo ? 600 : 400 }}
                        >
                          {p.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Mapa en vivo, solo cuando de verdad hay alguien en camino */}
            {enCamino && seguimiento.punto && (
              <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.cardBorder}` }}>
                <div style={{ height: 200 }}>
                  <MapContainer
                    center={[seguimiento.punto.lat, seguimiento.punto.lng]}
                    zoom={15}
                    zoomControl={false}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[seguimiento.punto.lat, seguimiento.punto.lng]} icon={pinRepartidor} />
                    {seguimiento.destino && (
                      <Marker position={[seguimiento.destino.lat, seguimiento.destino.lng]} icon={pinCasa} />
                    )}
                    <EncuadreDeViaje punto={seguimiento.punto} destino={seguimiento.destino} />
                  </MapContainer>
                </div>
                <div className="px-4 py-3 flex items-center gap-2 text-sm font-semibold"
                     style={{ color: seguimiento.yaCasi ? '#14663A' : '#173F94', background: c.cardBg }}>
                  <Bike className="w-4 h-4" />
                  {seguimiento.yaCasi ? 'Ya casi toca su puerta' : seguimiento.espera}
                  {seguimiento.distancia ? ` · a ${seguimiento.distancia}` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div style={tarjeta} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.textMuted }}>Productos</span>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.textMuted }}>N.º ítems</span>
            </div>
            <div className="flex flex-col">
              {pedido.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${c.cardBorder}` : 'none' }}
                >
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: c.primaryLight || 'rgba(0,0,0,0.04)' }}
                  >
                    {item.productId?.image
                      ? <img src={item.productId.image} alt="" className="max-w-full max-h-full object-contain" />
                      : <Package className="w-5 h-5" style={{ color: c.textMuted }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: c.textPrimary }}>
                      {item.name || item.productId?.name || 'Producto'}
                    </div>
                    <div className="text-sm font-bold" style={{ color: c.textPrimary }}>
                      ${(Number(item.price) * Number(item.amount)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: c.textMuted }}>{item.amount} u</div>
                </div>
              ))}
            </div>
          </div>

          {/* Valoración: solo cuando el pedido ya se entregó. */}
          {estado === 'entregado' && <ValoracionPedido items={pedido.items} pedidoId={pedido._id} />}
        </div>

        {/* ── Columna derecha: resumen ── */}
        <div style={tarjeta} className="p-6 h-fit">
          <div className="text-sm font-bold mb-1" style={{ color: c.textPrimary }}>Resumen del pedido</div>
          <div className="flex items-center gap-1 text-xs font-semibold mb-4" style={{ color: c.primary }}>
            <Hash className="w-3.5 h-3.5" /> {numero}
          </div>

          <div className="flex justify-between text-sm mb-2" style={{ color: c.textSecondary }}>
            <span>Productos</span><span style={{ color: c.textPrimary }}>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2" style={{ color: c.textSecondary }}>
            <span>Gastos de envío</span>
            <span style={{ color: c.textPrimary }}>{envio > 0 ? `$${envio.toFixed(2)}` : 'Gratis'}</span>
          </div>
          {servicio > 0 && (
            <div className="flex justify-between text-sm mb-2" style={{ color: c.textSecondary }}>
              <span>Tarifa de servicio</span>
              <span style={{ color: c.textPrimary }}>${servicio.toFixed(2)}</span>
            </div>
          )}
          {descuento > 0 && (
            <div className="flex justify-between text-sm mb-2" style={{ color: c.textSecondary }}>
              <span>Descuento por puntos</span><span style={{ color: '#16a34a' }}>−${descuento.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: `1px solid ${c.cardBorder}` }}>
            <span className="text-base font-bold" style={{ color: c.textPrimary }}>Total</span>
            <span className="text-lg font-extrabold" style={{ color: c.textPrimary }}>${total.toFixed(2)}</span>
          </div>

          {/* Método de pago real */}
          <div className="flex items-center gap-2 text-sm mt-4 pt-4" style={{ borderTop: `1px solid ${c.cardBorder}`, color: c.textPrimary }}>
            <infoPago.Icono className="w-5 h-5" style={{ color: c.primary }} />
            {infoPago.label}
          </div>

          {/* Entrega real */}
          <div className="flex items-start gap-2 text-sm mt-3 pt-4" style={{ borderTop: `1px solid ${c.cardBorder}`, color: c.textPrimary }}>
            {esDomicilio
              ? <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: c.primary }} />
              : <StoreFront className="w-5 h-5 flex-shrink-0" style={{ color: c.primary }} />}
            <div className="min-w-0">
              <div className="font-semibold">{esDomicilio ? 'Dirección de entrega' : 'Retiro en el local'}</div>
              {esDomicilio && (
                <div style={{ color: c.textSecondary }}>
                  {pedido.deliveryAddress || 'Sin dirección'}
                  {pedido.deliveryReference ? ` (${pedido.deliveryReference})` : ''}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-5 py-3 rounded-xl font-bold"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            Volver a la tienda
          </button>
        </div>
      </div>

      {/* En pantalla chica la rejilla de dos columnas se apila */}
      <style>{`
        @media (max-width: 760px) {
          .grid[style*="320px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default EstadoPedido;
