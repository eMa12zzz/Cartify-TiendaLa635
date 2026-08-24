import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/*
 * ============================================================
 * EL MAPA DEL REPARTIDOR — MapaSeguimiento.jsx
 * ============================================================
 * Dónde va quien trae el pedido y a qué casa va, en vivo.
 *
 * POR QUÉ VIVE APARTE
 * Este mapa estaba copiado tal cual en tres pantallas —la burbuja, el estado
 * del pedido y la confirmación del pago— con sus dos pines y su encuadre
 * repetidos en cada una. Es el mismo copiar y pegar que ya nos costó un bug
 * con la lista de pasos: una de las copias se quedó vieja y un pedido en
 * camino se mostraba como recibido. Antes de hacer una cuarta copia para
 * "Mis pedidos", el mapa baja aquí.
 *
 * Se calla solo si no hay nada que dibujar. Un mapa vacío de una ciudad al
 * azar no informa: confunde.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

// Los dos puntos: quien trae el pedido y la casa a donde va.
const pinRepartidor = divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2563eb;border:3px solid #fff;
    box-shadow:0 0 0 5px rgba(37,99,235,.22), 0 2px 6px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pinCasa = divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50% 50% 50% 0;
    background:${BROWN};transform:rotate(-45deg);
    border:2.5px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

/*
 * Encuadra el mapa para que se vean los dos puntos a la vez.
 *
 * Centrado solo en el repartidor, la casa quedaba fuera y el mapa no
 * respondía la única pregunta que importa: ¿qué tan cerca va de mí? Conforme
 * se acerca, el encuadre se va cerrando solo, y ese apretarse cuenta el
 * avance sin necesidad de una barra de progreso.
 */
const Encuadre = ({ punto, destino }) => {
  const mapa = useMap();

  if (punto && destino) {
    mapa.fitBounds(latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
      padding: [34, 34],
      maxZoom: 16,
      animate: true,
    });
  } else if (punto) {
    // Pedidos viejos, sin punto de destino guardado: al menos se ve al que viene.
    mapa.setView([punto.lat, punto.lng], 15);
  } else if (destino) {
    // Todavía no ha salido nadie: se muestra a dónde le vamos a llevar.
    mapa.setView([destino.lat, destino.lng], 15);
  }

  return null;
};

/*
 * @param punto   - dónde va el repartidor ahora ({lat,lng}), o null.
 * @param destino - la casa del cliente ({lat,lng}), o null.
 * @param alto    - alto del mapa en px.
 * @param borde   - color del borde; 'transparent' cuando ya lo pone el padre.
 * @param interactivo - si se puede arrastrar y hacer zoom.
 *
 * `interactivo` en falso es para el mapa de la burbuja: ahí el mapa es una
 * miniatura de 132px que se mira de reojo, y dejarla arrastrable hacía que al
 * intentar desplazar la página con el dedo se moviera el mapa en su lugar y la
 * página se quedara quieta. En un mapa de ese tamaño no hay nada que explorar.
 */
const MapaSeguimiento = ({ punto, destino, alto = 200, borde, interactivo = true }) => {
  // Sin ningún punto no hay mapa que valga la pena: ver el encabezado.
  if (!punto && !destino) return null;

  const centro = punto || destino;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${borde || 'var(--linea, #e5e5e5)'}`,
      }}
    >
      <div style={{ height: alto }}>
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={15}
          zoomControl={false}
          attributionControl={false}
          dragging={interactivo}
          scrollWheelZoom={interactivo}
          doubleClickZoom={interactivo}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {destino && <Marker position={[destino.lat, destino.lng]} icon={pinCasa} />}
          {punto && <Marker position={[punto.lat, punto.lng]} icon={pinRepartidor} />}
          <Encuadre punto={punto} destino={destino} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaSeguimiento;
