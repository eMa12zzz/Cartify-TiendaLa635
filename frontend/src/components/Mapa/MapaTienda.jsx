import '../../lib/maplibreWorker';
import { useEffect, useRef } from 'react';
import { Map, MapMarker, MarkerContent, MapControls, useMap } from '../mapcn/map';

/*
 * ============================================================
 * EL MAPA DE LA TIENDA — MapaTienda.jsx
 * ============================================================
 * Un solo mapa para toda la web: marcar la dirección, seguir al repartidor,
 * el mapa del reparto y la ubicación de la tienda en el panel. Por dentro es
 * mapcn (MapLibre, mapas vectoriales de CARTO); por fuera, cada pantalla solo
 * dice QUÉ quiere ver, con datos:
 *
 *   <Mapa
 *     centro={{ lat, lng }} zoom={15}
 *     pines={[{ id: 'casa', lat, lng, tipo: 'gota', arrastrable, onSoltar }]}
 *     onTocar={({ lat, lng }) => ...}
 *     seguir={{ punto, zoomMinimo: 16, volar: true }}
 *     encuadrar={[punto, destino]}
 *     interactivo={false}
 *   />
 *
 * Antes cada pantalla armaba su propio Leaflet, con sus pines escritos como
 * HTML en texto. Cambiar de mapa obligaba a tocar cinco archivos; ahora es
 * este.
 *
 * OJO CON EL ORDEN DE LAS COORDENADAS: MapLibre usa [lng, lat] y el resto de
 * la app {lat, lng}. La traducción pasa SOLO aquí adentro; las pantallas
 * nunca ven un arreglo de coordenadas.
 *
 * No se importa directo: se usa Mapa.jsx, que lo carga solo cuando hace falta
 * (MapLibre pesa mucho para bajarlo en cada visita a la portada).
 * ============================================================
 */

const esCoord = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const valido = (p) => !!p && esCoord(p.lat) && esCoord(p.lng);

/* ── Los pines ─────────────────────────────────────────────── */

/*
 * La gota: el pin de "aquí". Un cuadrado con tres esquinas redondas girado
 * 45°, del color de la marca (sigue a la temporada).
 */
const Gota = ({ tamano = 22, color = 'var(--marca-600)' }) => (
  <div
    style={{
      width: tamano,
      height: tamano,
      borderRadius: '50% 50% 50% 0',
      background: color,
      transform: 'rotate(-45deg)',
      border: `${Math.max(2.5, tamano * 0.1)}px solid #fff`,
      boxShadow: '0 4px 10px rgba(0,0,0,.3)',
    }}
  />
);

/*
 * El repartidor: un punto azul con halo que late, como el "usted está aquí"
 * de cualquier app de mapas. Se distingue de la gota de un vistazo.
 */
const PuntoEnVivo = ({ tamano = 16 }) => (
  <div style={{ position: 'relative', width: tamano, height: tamano }}>
    <span
      className="motion-safe:animate-ping"
      style={{
        position: 'absolute',
        inset: -tamano * 0.35,
        borderRadius: '50%',
        background: 'rgba(37,99,235,.28)',
      }}
    />
    <span
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: '#2563eb',
        border: '3px solid #fff',
        boxShadow: '0 0 0 5px rgba(37,99,235,.22), 0 2px 6px rgba(0,0,0,.3)',
      }}
    />
  </div>
);

/* ── Lo que se mueve con el mapa ───────────────────────────── */

// Tocar el mapa devuelve el punto tocado.
const AlTocar = ({ onTocar }) => {
  const { map } = useMap();
  // La función más reciente, sin volver a suscribir el clic en cada render.
  const ref = useRef(onTocar);
  useEffect(() => {
    ref.current = onTocar;
  });

  useEffect(() => {
    if (!map) return undefined;
    const manejar = (e) => ref.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    map.on('click', manejar);
    return () => map.off('click', manejar);
  }, [map]);

  return null;
};

/*
 * Mueve la cámara cuando cambian los puntos que importan.
 *
 * - encuadrar: que se vean todos a la vez (el repartidor Y la casa). Conforme
 *   se acercan el encuadre se cierra solo, y eso cuenta el avance sin barra.
 * - seguir: centrar en un punto (el GPS encontró a la persona, o movió el pin).
 *
 * Se dispara por los NÚMEROS de las coordenadas y no por el objeto: cada render
 * trae un objeto nuevo con los mismos valores, y re-encuadrar por eso haría
 * temblar el mapa en cada tecla que se escribe al lado.
 */
const Camara = ({ encuadrar, seguir }) => {
  const { map } = useMap();

  const puntos = (encuadrar || []).filter(valido);
  const claveEncuadre = puntos.map((p) => `${p.lat},${p.lng}`).join('|');

  useEffect(() => {
    if (!map || !puntos.length) return;
    if (puntos.length === 1) {
      map.easeTo({ center: [puntos[0].lng, puntos[0].lat], zoom: 15, duration: 500 });
      return;
    }
    const lngs = puntos.map((p) => Number(p.lng));
    const lats = puntos.map((p) => Number(p.lat));
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 34, maxZoom: 16, duration: 600 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, claveEncuadre]);

  const punto = valido(seguir?.punto) ? seguir.punto : null;
  // `forzar` recentra aunque el punto sea el mismo (buscar dos veces la misma
  // dirección después de haber movido el mapa a mano).
  const claveSeguir = punto ? `${punto.lat},${punto.lng},${seguir.forzar ?? ''}` : '';

  useEffect(() => {
    if (!map || !punto) return;
    const zoom = Math.max(map.getZoom(), seguir.zoomMinimo ?? 16);
    const center = [Number(punto.lng), Number(punto.lat)];
    if (seguir.volar) map.flyTo({ center, zoom, duration: 800 });
    else map.easeTo({ center, zoom, duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, claveSeguir]);

  return null;
};

/*
 * El crédito de los mapas ("© CARTO, © OpenStreetMap") es obligatorio, pero
 * MapLibre lo muestra desplegado al cargar y en una miniatura de 132px tapaba
 * medio mapa. Se deja plegado en su botón "i": sigue ahí para quien lo toque.
 */
const CreditoPlegado = () => {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
  }, [map, isLoaded]);
  return null;
};

/* ── El mapa ────────────────────────────────────────────────── */

/**
 * @param centro      {lat,lng} donde arranca la cámara.
 * @param zoom        zoom inicial.
 * @param pines       [{ id, lat, lng, tipo: 'gota'|'repartidor', tamano, color, arrastrable, onSoltar }]
 * @param onTocar     ({lat,lng}) al tocar el mapa. Sin él, tocar no hace nada.
 * @param seguir      { punto, zoomMinimo, volar } centra cuando cambia el punto.
 * @param encuadrar   [puntos] encuadra para que se vean todos.
 * @param interactivo si se puede arrastrar y hacer zoom (falso en miniaturas:
 *                    en un mapa chico el dedo quiere desplazar la PÁGINA).
 * @param controles   muestra los botones de zoom.
 */
const MapaTienda = ({
  centro,
  zoom = 15,
  pines = [],
  onTocar,
  seguir,
  encuadrar,
  interactivo = true,
  controles = false,
  className,
}) => {
  const inicio = valido(centro) ? centro : { lat: 13.6929, lng: -89.2182 };

  return (
    <Map
      theme="light"
      className={className}
      center={[Number(inicio.lng), Number(inicio.lat)]}
      zoom={zoom}
      interactive={interactivo}
    >
      {onTocar && <AlTocar onTocar={onTocar} />}
      <Camara encuadrar={encuadrar} seguir={seguir} />
      <CreditoPlegado />

      {pines.filter(valido).map((pin) => (
        <MapMarker
          key={pin.id}
          longitude={Number(pin.lng)}
          latitude={Number(pin.lat)}
          anchor={pin.tipo === 'repartidor' ? 'center' : 'bottom'}
          draggable={!!pin.arrastrable}
          onDragEnd={pin.onSoltar ? (lngLat) => pin.onSoltar({ lat: lngLat.lat, lng: lngLat.lng }) : undefined}
        >
          <MarkerContent className={pin.arrastrable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}>
            {pin.tipo === 'repartidor'
              ? <PuntoEnVivo tamano={pin.tamano} />
              : <Gota tamano={pin.tamano} color={pin.color} />}
          </MarkerContent>
        </MapMarker>
      ))}

      {controles && interactivo && <MapControls position="bottom-right" showZoom />}
    </Map>
  );
};

export default MapaTienda;
