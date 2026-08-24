import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, Navigation, Signpost, Phone, Package, MapPin, Radio, Sun, TriangleAlert } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useReparto, enlaceDeRuta } from '../../hooks/useReparto';
import { useViajeEnVivo } from '../../hooks/useViajeEnVivo';
import { useAjustesCtx } from '../../context/AjustesContext';
import ModalCodigoEntrega from '../../components/Admin/ModalCodigoEntrega';

/*
 * Reparto — los pedidos a domicilio pendientes, para quien los lleva.
 *
 * Vive en el área de cliente porque el repartidor trabaja desde el teléfono
 * en la calle. Cada pedido muestra el punto en el mapa, la referencia y un
 * botón que abre la navegación del teléfono.
 *
 * Además, desde aquí se comparte la ubicación en vivo: el pedido que se suma
 * al viaje empieza a mandar dónde va, y el cliente lo ve avanzar.
 */

const pinEntrega = divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:var(--marca-600);transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

// El repartidor en su propio mapa: círculo con halo, para distinguirlo de una
// sola mirada del pin del destino.
const pinRepartidor = divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#2563eb;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(37,99,235,.22), 0 3px 8px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }) : '';

const Reparto = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { pedidos, cargando, moviendo, habilitado, avanzar } = useReparto();
  const {
    enViaje, posicion, error: errorGPS, pantallaDespierta,
    vaEnViaje, empezarViaje, quitarDelViaje,
  } = useViajeEnVivo();
  // De dónde sale el reparto: la dirección guardada en Personalización, no
  // la ubicación del teléfono que abre el enlace.
  const { ajustes } = useAjustesCtx();

  /*
   * EL PEDIDO QUE SE ESTÁ POR ENTREGAR, esperando los cuatro dígitos.
   *
   * Esta pantalla es la que de verdad importa para el código: es la que el
   * repartidor tiene en la mano en la puerta, cuando alguien sale a recibir.
   * Aquí es donde se pregunta "¿me dice su código?" y donde se comprueba que
   * quien recibe es quien pidió.
   */
  const [pedidoAEntregar, setPedidoAEntregar] = useState(null);

  /*
   * Entregar cierra el viaje de ese pedido: nadie tiene que acordarse de
   * apagar el compartir después de tocar el timbre.
   *
   * El `quitarDelViaje` va DESPUÉS del await y solo si no hubo error: si el
   * código no coincidió, el pedido sigue en camino y el cliente tiene que
   * seguir viendo moverse el punto en su mapa.
   */
  const entregar = async (pedido, extras) => {
    await avanzar(pedido, 'entregado', extras);
    if (vaEnViaje(pedido._id)) quitarDelViaje(pedido._id);
  };

  /*
   * Si el código no coincide el servidor responde 400, `avanzar` relanza y el
   * modal se queda ABIERTO. Cerrarlo obligaría a buscar el pedido otra vez en
   * la lista, con el cliente esperando en la puerta.
   */
  const confirmarEntrega = async (extras) => {
    try {
      await entregar(pedidoAEntregar, extras);
      setPedidoAEntregar(null);
    } catch {
      // El aviso ya lo pintó el interceptor. Aquí solo se decide no cerrar.
    }
  };

  /*
   * "Voy en camino" marcaba SOLO el GPS, sin tocar el estado del pedido —
   * dos acciones separadas que era fácil hacer a medias: si alguien salía a
   * repartir sin acordarse de este botón aparte, el cliente se quedaba
   * viendo "Preparando" toda la entrega, sin mapa ni aviso. Ahora un solo
   * botón hace las dos cosas: marca 'en_camino' y, si el pedido trae punto
   * en el mapa, empieza a compartir la ubicación de una vez.
   */
  const salirEnCamino = async (pedido) => {
    await avanzar(pedido, 'en_camino');
    if (pedido.deliveryLat != null && pedido.deliveryLng != null) empezarViaje(pedido._id);
  };

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
      <p className="text-sm mb-4" style={{ color: c.textSecondary }}>
        Pedidos a domicilio que faltan por entregar.
      </p>

      {/*
        Mientras se comparte la ubicación conviene decirlo grande y sin
        rodeos: es la ubicación de una persona: nadie debería descubrir por
        casualidad que su teléfono estuvo transmitiendo.
      */}
      {enViaje.length > 0 && (
        <div
          className="rounded-2xl p-3.5 mb-5 flex items-start gap-3"
          style={{ backgroundColor: '#EFF5FF', border: '1px solid #CFE0FF' }}
        >
          <span className="relative flex-none mt-0.5">
            <Radio className="w-5 h-5" style={{ color: '#1D4ED8' }} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: '#173F94' }}>
              Compartiendo su ubicación · {enViaje.length} {enViaje.length === 1 ? 'pedido' : 'pedidos'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#3E5FA3' }}>
              {pantallaDespierta
                ? 'La pantalla se mantendrá encendida mientras dure el viaje.'
                : 'Deje la pantalla encendida: si el teléfono se bloquea, el cliente deja de verlo avanzar.'}
            </p>
            {pantallaDespierta && (
              <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: '#3E5FA3' }}>
                <Sun className="w-3.5 h-3.5" /> Pantalla activa
              </p>
            )}
          </div>
        </div>
      )}

      {errorGPS && (
        <div
          className="rounded-2xl p-3.5 mb-5 flex items-start gap-3"
          style={{ backgroundColor: '#FFF6E9', border: '1px solid #F3DFC0' }}
        >
          <TriangleAlert className="w-5 h-5 flex-none mt-0.5" style={{ color: '#B4590C' }} />
          <p className="text-sm" style={{ color: '#7A3E08' }}>{errorGPS}</p>
        </div>
      )}

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
            const compartiendo = vaEnViaje(p._id);
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
                      {/* Su propio punto, para confirmar de un vistazo que el
                          GPS está agarrando y no está mandando cualquier cosa */}
                      {compartiendo && posicion && (
                        <Marker position={[posicion.lat, posicion.lng]} icon={pinRepartidor} />
                      )}
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
                        backgroundColor: p.status === 'en_camino' ? '#EFF5FF' : p.status === 'preparando' ? '#FFF4E5' : '#E8F1FF',
                        color: p.status === 'en_camino' ? '#1D4ED8' : p.status === 'preparando' ? '#B4590C' : '#0F47AF',
                      }}
                    >
                      {p.status === 'en_camino' ? 'En camino' : p.status === 'preparando' ? 'Preparando' : 'Por preparar'}
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
                      href={enlaceDeRuta(p, ajustes.direccion)}
                      target="_blank"
                      rel="noreferrer"
                      className="press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: c.primary, color: c.buttonText }}
                    >
                      <Navigation className="w-4 h-4" /> Cómo llegar
                    </a>

                    {p.status === 'pagado' && (
                      <button
                        onClick={() => { avanzar(p, 'preparando').catch(() => {}); }}
                        disabled={moviendo === p._id}
                        className="press flex-1 py-2.5 rounded-full text-sm font-bold border disabled:opacity-60"
                        style={{ borderColor: c.cardBorder, color: c.textPrimary }}
                      >
                        {moviendo === p._id ? 'Marcando…' : 'Empezar a preparar'}
                      </button>
                    )}
                    {p.status === 'preparando' && (
                      <button
                        onClick={() => { salirEnCamino(p).catch(() => {}); }}
                        disabled={moviendo === p._id}
                        className="press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold border"
                        style={{ borderColor: '#1D4ED8', color: '#1D4ED8' }}
                      >
                        <Bike className="w-4 h-4" /> {moviendo === p._id ? 'Marcando…' : 'Salí a repartir'}
                      </button>
                    )}
                    {p.status === 'en_camino' && (
                      <button
                        onClick={() => setPedidoAEntregar(p)}
                        disabled={moviendo === p._id}
                        className="press flex-1 py-2.5 rounded-full text-sm font-bold border disabled:opacity-60"
                        style={{ borderColor: '#16a34a', color: '#16a34a' }}
                      >
                        {moviendo === p._id ? 'Marcando…' : 'Marcar entregado'}
                      </button>
                    )}

                    {/*
                      El interruptor manual de compartir ubicación queda
                      como respaldo — para cuando el GPS falló al salir y hay
                      que reactivarlo a mano, o para pausarlo — pero ya no es
                      la manera de avisar que salió: eso lo hace el botón de
                      arriba, que marca el estado Y empieza a compartir de una
                      vez. Por eso solo aparece una vez que el pedido YA está
                      en camino, no antes.
                    */}
                    {hayPunto && p.status === 'en_camino' && (
                      compartiendo ? (
                        <button
                          onClick={() => quitarDelViaje(p._id)}
                          className="press w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold border"
                          style={{ borderColor: '#1D4ED8', color: '#1D4ED8', backgroundColor: '#EFF5FF' }}
                        >
                          <Radio className="w-4 h-4" /> Dejar de compartir
                        </button>
                      ) : (
                        <button
                          onClick={() => empezarViaje(p._id)}
                          className="press w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold border"
                          style={{ borderColor: c.cardBorder, color: c.textPrimary }}
                        >
                          <Radio className="w-4 h-4" /> Volver a compartir ubicación
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*
        "¿Me dice su código?" — la pregunta de la puerta.

        El `key` atado al id reinicia el formulario entre una entrega y la
        siguiente: sin él, el código de la casa anterior se quedaba escrito y
        la próxima se confirmaba con un número que no era suyo. Ver el
        comentario de ModalCodigoEntrega.
      */}
      <ModalCodigoEntrega
        key={pedidoAEntregar?._id || 'sin-pedido'}
        isOpen={!!pedidoAEntregar}
        pedido={pedidoAEntregar}
        onClose={() => setPedidoAEntregar(null)}
        onConfirm={confirmarEntrega}
      />
    </div>
  );
};

export default Reparto;
