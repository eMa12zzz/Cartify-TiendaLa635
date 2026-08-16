import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, ChefHat, Check, Bike } from 'lucide-react';
import { useSeguimientoEnVivo } from '../../hooks/useSeguimientoEnVivo';

/*
 * ============================================================
 * SEGUIMIENTO EN LA CONFIRMACIÓN — SeguimientoConfirmacion.jsx
 * ============================================================
 * Lo que antes obligaba a tocar "Ver el estado del pedido": el avance del
 * pedido y el mapa del repartidor, AHORA MISMO en la pantalla de confirmación
 * y actualizándose solo (el hook consulta cada 10 s, sin recargar).
 *
 * En un pedido a domicilio el mapa muestra siempre la dirección de entrega, y
 * cuando el repartidor sale a la calle aparece su punto y el tiempo estimado.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

const PASOS = [
  { id: 'pagado',     label: 'Recibido',   Icono: Package },
  { id: 'preparando', label: 'Preparando', Icono: ChefHat },
  { id: 'entregado',  label: 'Entregado',  Icono: Check },
];

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

// Encuadra el mapa: los dos puntos si hay repartidor, o solo la casa si aún no.
const Encuadre = ({ punto, destino }) => {
  const mapa = useMap();
  if (punto && destino) {
    mapa.fitBounds(latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
      padding: [34, 34], maxZoom: 16, animate: true,
    });
  } else if (destino) {
    mapa.setView([destino.lat, destino.lng], 15);
  } else if (punto) {
    mapa.setView([punto.lat, punto.lng], 15);
  }
  return null;
};

const SeguimientoConfirmacion = ({ orderId, esDomicilio }) => {
  const seg = useSeguimientoEnVivo(orderId, !!orderId);

  const estado = seg.estado || 'pagado';
  const pasoActual = Math.max(0, PASOS.findIndex((p) => p.id === estado));
  const enCamino = esDomicilio && seg.enVivo;
  const tieneDestino = esDomicilio && seg.destino?.lat != null && seg.destino?.lng != null;

  return (
    <div>
      {/* Línea de tiempo, viva */}
      <div style={{ display: 'flex', margin: '4px 0 6px' }}>
        {PASOS.map((p, i) => {
          const activo = i <= pasoActual;
          return (
            <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < PASOS.length - 1 && (
                <div style={{
                  position: 'absolute', height: 2, top: 6, left: '50%', right: '-50%',
                  background: i < pasoActual ? BROWN : 'var(--linea)',
                }} />
              )}
              <div style={{
                width: 14, height: 14, borderRadius: '50%', marginBottom: 6, position: 'relative', zIndex: 1,
                background: activo ? BROWN : 'var(--linea)',
              }} />
              <div style={{ fontSize: 12, textAlign: 'center', color: activo ? BROWN : 'var(--tinta-tenue)', fontWeight: activo ? 600 : 400 }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mapa: la dirección siempre; el repartidor cuando sale a la calle. */}
      {tieneDestino && (
        <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--linea)' }}>
          <div style={{ height: 200 }}>
            <MapContainer
              center={[seg.destino.lat, seg.destino.lng]}
              zoom={15}
              zoomControl={false}
              attributionControl={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[seg.destino.lat, seg.destino.lng]} icon={pinCasa} />
              {enCamino && seg.punto && (
                <Marker position={[seg.punto.lat, seg.punto.lng]} icon={pinRepartidor} />
              )}
              <Encuadre punto={enCamino ? seg.punto : null} destino={seg.destino} />
            </MapContainer>
          </div>
          <div style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 700,
            color: enCamino ? (seg.yaCasi ? '#14663A' : '#173F94') : 'var(--tinta-suave)',
            background: 'var(--papel)',
          }}>
            {enCamino
              ? <><Bike size={15} strokeWidth={2.4} /> {seg.yaCasi ? 'Ya casi toca su puerta' : seg.espera}{seg.distancia ? ` · a ${seg.distancia}` : ''}</>
              : (estado === 'entregado'
                  ? <><Check size={15} strokeWidth={2.4} /> Entregado en su dirección</>
                  : <>Aquí le llevaremos su pedido. En cuanto el repartidor salga, verá su punto moverse.</>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientoConfirmacion;
