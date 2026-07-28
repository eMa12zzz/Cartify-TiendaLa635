import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, Navigation, Signpost, Phone, Package, MapPin } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useReparto, enlaceDeRuta } from '../../hooks/useReparto';

/*
 * Reparto — los pedidos a domicilio pendientes, para quien los lleva.
 *
 * Vive en el área de cliente porque el repartidor trabaja desde el teléfono
 * en la calle. Cada pedido muestra el punto en el mapa, la referencia y un
 * botón que abre la navegación del teléfono.
 */

const pinEntrega = divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:#B46C30;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }) : '';

const Reparto = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { pedidos, cargando, moviendo, habilitado, avanzar } = useReparto();

  // Un cliente no reparte: si llega aquí de casualidad, se le dice y ya.
  if (!habilitado) {
    return (
      <div className="py-16 text-center">
        <Bike className="w-10 h-10 mx-auto mb-3" style={{ color: c.textMuted }} />
        <p className="text-sm font-semibold" style={{ color: c.textPrimary }}>
          Esta pantalla es para el personal de la tienda
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: c.textPrimary }}>Reparto</h1>
      <p className="text-sm mb-6" style={{ color: c.textSecondary }}>
        Pedidos a domicilio que faltan por entregar.
      </p>

      {cargando ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando los pedidos…</p>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>
            No hay entregas pendientes
          </p>
          <p className="text-sm" style={{ color: c.textSecondary }}>
            Cuando entre un pedido a domicilio, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pedidos.map((p) => {
            const hayPunto = p.deliveryLat != null && p.deliveryLng != null;
            return (
              <div
                key={p._id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
              >
                {/*
                  El mapa solo se dibuja si el pedido trae coordenadas. Los
                  pedidos viejos guardaron nada más el texto de la dirección.
                */}
                {hayPunto && (
                  <div style={{ height: 150 }}>
                    <MapContainer
                      center={[p.deliveryLat, p.deliveryLng]}
                      zoom={16}
                      zoomControl={false}
                      attributionControl={false}
                      dragging={false}
                      scrollWheelZoom={false}
                      doubleClickZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[p.deliveryLat, p.deliveryLng]} icon={pinEntrega} />
                    </MapContainer>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold" style={{ color: c.textPrimary }}>
                        {p.clientId?.fullName || 'Cliente'}
                      </div>
                      <div className="text-xs" style={{ color: c.textMuted }}>
                        #{String(p._id).slice(-6).toUpperCase()} · {p.items?.length || 0} productos · {dinero(p.total)}
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full flex-none"
                      style={{
                        backgroundColor: p.status === 'preparando' ? '#FFF4E5' : '#E8F1FF',
                        color: p.status === 'preparando' ? '#B4590C' : '#0F47AF',
                      }}
                    >
                      {p.status === 'preparando' ? 'Preparando' : 'Por preparar'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 flex-none mt-0.5" style={{ color: c.primary }} />
                    <span className="text-sm" style={{ color: c.textPrimary }}>{p.deliveryAddress}</span>
                  </div>

                  {p.deliveryReference && (
                    <div className="flex items-start gap-2 mb-1">
                      <Signpost className="w-4 h-4 flex-none mt-0.5" style={{ color: c.textMuted }} />
                      <span className="text-xs" style={{ color: c.textSecondary }}>{p.deliveryReference}</span>
                    </div>
                  )}

                  {p.clientId?.phoneNumber && (
                    <a
                      href={`tel:${p.clientId.phoneNumber}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold mt-1"
                      style={{ color: c.primary }}
                    >
                      <Phone className="w-3.5 h-3.5" /> {p.clientId.phoneNumber}
                    </a>
                  )}

                  {p.preparedAt && (
                    <p className="text-xs mt-2" style={{ color: c.textMuted }}>
                      Preparado a las {hora(p.preparedAt)}{p.preparedBy ? ` por ${p.preparedBy}` : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {/*
                      Abre el mapa del teléfono con la ruta: ahí ya hay
                      navegación por voz y tráfico, que no tiene sentido
                      reconstruir aquí.
                    */}
                    <a
                      href={enlaceDeRuta(p)}
                      target="_blank"
                      rel="noreferrer"
                      className="press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: c.primary, color: c.buttonText }}
                    >
                      <Navigation className="w-4 h-4" /> Cómo llegar
                    </a>

                    {p.status === 'pagado' ? (
                      <button
                        onClick={() => avanzar(p, 'preparando')}
                        disabled={moviendo === p._id}
                        className="press flex-1 py-2.5 rounded-full text-sm font-bold border disabled:opacity-60"
                        style={{ borderColor: c.cardBorder, color: c.textPrimary }}
                      >
                        {moviendo === p._id ? 'Marcando…' : 'Empezar a preparar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => avanzar(p, 'entregado')}
                        disabled={moviendo === p._id}
                        className="press flex-1 py-2.5 rounded-full text-sm font-bold border disabled:opacity-60"
                        style={{ borderColor: '#16a34a', color: '#16a34a' }}
                      >
                        {moviendo === p._id ? 'Marcando…' : 'Marcar entregado'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reparto;
