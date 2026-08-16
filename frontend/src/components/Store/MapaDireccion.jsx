import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin, Loader2 } from 'lucide-react';
import { useUbicacion, CENTRO_POR_DEFECTO } from '../../hooks/useUbicacion';

/*
 * ============================================================
 * MARCAR LA DIRECCIÓN EN EL MAPA — MapaDireccion.jsx
 * ============================================================
 * El mapa donde el cliente pone el pin en su portón, con los campos de la
 * dirección al lado. Se usa SIN salir de donde está: dentro del checkout y
 * dentro de Mi Cuenta → Direcciones.
 *
 * POR QUÉ EL MAPA NO ES OPCIONAL
 * Antes se podía escribir la dirección a ciegas en una caja de texto. El
 * resultado eran direcciones sin coordenadas, y eso rompe tres cosas a la vez:
 *
 *   1. El repartidor sale con un texto y sin saber a qué portón tocar. "Calle
 *      Principal 123" hay en media ciudad.
 *   2. El envío se cobra por DISTANCIA. Sin punto no hay distancia, así que
 *      cae a la tarifa plana — que le cobra de más al de la esquina y de menos
 *      al del otro lado del municipio.
 *   3. El cliente no puede seguir su pedido en el mapa, porque no hay destino
 *      que dibujar.
 *
 * Por eso aquí no se puede guardar sin pin. Lo que sí se puede es corregir el
 * texto: Nominatim acierta la calle pero no sabe que es "la casa de portón
 * verde", y eso lo pone la persona.
 *
 * POR QUÉ VA INCRUSTADO Y NO EN OTRA PANTALLA
 * Mandar a alguien a otra pantalla en medio del pago es el peor momento para
 * pedirle un viaje: ya tenía la plata en la mano. Antes se resolvió dejándolo
 * escribir a ciegas; la salida buena era traer el mapa aquí, no quitarlo.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

const pin = divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:${'var(--marca-600)'};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.3);"></div>`,
});

// Tocar el mapa mueve el pin. Es la forma natural de decir "aquí" con el dedo.
const AlTocar = ({ onTocar }) => {
  useMapEvents({ click: (e) => onTocar({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

/*
 * Cuando el GPS encuentra a la persona, el mapa la sigue. Sin esto el pin
 * aparecía en su casa y el mapa se quedaba mirando el centro de San Salvador.
 */
const SeguirAlPin = ({ punto }) => {
  const mapa = useMap();
  if (punto) mapa.setView([punto.lat, punto.lng], Math.max(mapa.getZoom(), 16));
  return null;
};

const MapaDireccion = ({ onGuardar, onCancelar, guardando = false, alto = 260 }) => {
  const { posicion, direccion, setDireccion, buscando, localizando, marcarEn, localizarme } = useUbicacion();
  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');

  const centro = posicion || CENTRO_POR_DEFECTO;
  // Sin pin no se guarda: ver el encabezado de este archivo.
  const listo = !!posicion && direccion.trim().length > 0 && !guardando;

  const guardar = (e) => {
    e.preventDefault();
    if (!listo) return;
    onGuardar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      lat: posicion.lat,
      lng: posicion.lng,
    });
  };

  const campo = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #e5e5e5', fontSize: 14, fontFamily: 'inherit',
    background: '#fff', color: '#1C1614', outline: 'none',
  };

  return (
    <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e5e5', position: 'relative' }}>
        <div style={{ height: alto }}>
          <MapContainer
            center={[centro.lat, centro.lng]}
            zoom={posicion ? 16 : 13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <AlTocar onTocar={marcarEn} />
            <SeguirAlPin punto={posicion} />
            {posicion && (
              <Marker
                position={[posicion.lat, posicion.lng]}
                icon={pin}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    marcarEn({ lat, lng });
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        {/*
          La instrucción va ENCIMA del mapa y no debajo: si va debajo, en un
          teléfono queda fuera de la pantalla y nadie se entera de que hay que
          tocar algo. Un mapa sin pin no se explica solo.
        */}
        {!posicion && (
          <div style={{
            position: 'absolute', top: 8, left: 8, right: 8, zIndex: 500,
            background: 'rgba(255,255,255,.94)', borderRadius: 8, padding: '7px 10px',
            fontSize: 12.5, color: '#5a4a3c', textAlign: 'center', pointerEvents: 'none',
          }}>
            Toque en el mapa dónde le dejamos su pedido
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={localizarme}
        disabled={localizando}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 999, border: `1.5px solid ${BROWN}`,
          background: '#fff', color: BROWN, fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: localizando ? 'default' : 'pointer',
          opacity: localizando ? 0.6 : 1,
        }}
      >
        {localizando
          ? <><Loader2 size={15} className="animate-spin" /> Buscándolo…</>
          : <><LocateFixed size={15} /> Usar mi ubicación</>}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label htmlFor="mapa-direccion" style={{ fontSize: 12.5, fontWeight: 600, color: '#5a4a3c' }}>
            Dirección
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="mapa-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder={posicion ? 'Calle, número y colonia' : 'Se llena al marcar en el mapa'}
              style={{ ...campo, marginTop: 3, paddingRight: 34 }}
            />
            {/* Mientras Nominatim traduce el punto a palabras. */}
            {buscando && (
              <Loader2
                size={15}
                className="animate-spin"
                style={{ position: 'absolute', right: 11, top: 14, color: '#bbb' }}
              />
            )}
          </div>
          {/*
            El texto se puede corregir a mano. El buscador acierta la calle
            pero no sabe que es "la casa del portón verde".
          */}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="mapa-nombre" style={{ fontSize: 12.5, fontWeight: 600, color: '#5a4a3c' }}>
              Nombre <span style={{ fontWeight: 400, color: '#9b8b7c' }}>(opcional)</span>
            </label>
            <input
              id="mapa-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Casa, Trabajo…"
              style={{ ...campo, marginTop: 3 }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label htmlFor="mapa-referencia" style={{ fontSize: 12.5, fontWeight: 600, color: '#5a4a3c' }}>
              Referencia <span style={{ fontWeight: 400, color: '#9b8b7c' }}>(opcional)</span>
            </label>
            <input
              id="mapa-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Portón verde, frente a la cancha"
              style={{ ...campo, marginTop: 3 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: '10px 16px', borderRadius: 999, border: '1px solid #e5e5e5',
              background: '#fff', color: '#5a4a3c', fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!listo}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 999, border: 'none',
            background: listo ? BROWN : '#ddd', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: listo ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <MapPin size={15} />
          {guardando ? 'Guardando…' : posicion ? 'Guardar esta dirección' : 'Marque el punto en el mapa'}
        </button>
      </div>
    </form>
  );
};

export default MapaDireccion;
