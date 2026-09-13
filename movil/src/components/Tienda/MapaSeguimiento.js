import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/*
 * ============================================================
 * EL MAPA DEL REPARTIDOR — MapaSeguimiento.js
 * ============================================================
 * Copia de `frontend/src/components/Store/MapaSeguimiento.jsx`: dónde va
 * quien trae el pedido y a qué casa va, en vivo. Mismos dos pines, mismo
 * encuadre, mismas teselas de OpenStreetMap — sin backend nuevo, sin llave
 * de Google Maps que pedir ni pagar.
 *
 * ── Por qué un WebView con Leaflet, y no react-native-maps ──
 * react-native-maps en Android SIEMPRE pasa por el SDK de Google Maps, tenga
 * o no tesela propia encima — hace falta su propia llave de API igual, con
 * su propio proyecto de facturación en Google Cloud. La web ya resolvió esto
 * sin ninguna llave, con Leaflet + OpenStreetMap; un WebView con esa misma
 * página adentro consigue el mismo mapa gratis, sin cuenta que crear.
 *
 * ── Por qué no vive montado todo el tiempo ──
 * Es una page HTML completa cargándose adentro de la burbuja: uno por pedido
 * en curso, no uno por pantalla. Por eso BurbujaPedido.js solo lo monta
 * mientras `enCamino` es cierto, igual que la web solo lo dibuja con
 * `enCamino &&`.
 * ============================================================
 */

const paginaHtml = (punto, destino, colorMarca) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; background: #EAE7E2; }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var punto = ${punto ? JSON.stringify(punto) : 'null'};
    var destino = ${destino ? JSON.stringify(destino) : 'null'};
    var centro = punto || destino;

    var mapa = L.map('mapa', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    }).setView([centro.lat, centro.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

    var pinCasa = L.divIcon({
      className: '',
      html: '<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:${colorMarca};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });
    var pinRepartidor = L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.22), 0 2px 6px rgba(0,0,0,.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (destino) L.marker([destino.lat, destino.lng], { icon: pinCasa }).addTo(mapa);
    if (punto) L.marker([punto.lat, punto.lng], { icon: pinRepartidor }).addTo(mapa);

    // Mismo encuadre que la web: los dos puntos a la vez si hay los dos, y
    // se va cerrando solo conforme el repartidor se acerca a la casa.
    if (punto && destino) {
      mapa.fitBounds(L.latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
        padding: [34, 34],
        maxZoom: 16,
      });
    }
  </script>
</body>
</html>`;

/*
 * @param punto      - dónde va el repartidor ahora ({lat,lng}), o null.
 * @param destino    - la casa del cliente ({lat,lng}), o null.
 * @param alto       - alto del mapa en dp.
 * @param colorMarca - color del pin de la casa; el del repartidor es fijo
 *                     (el mismo azul que la web, no cambia con la temporada).
 */
const MapaSeguimiento = ({ punto, destino, alto = 132, colorMarca = '#8C5628' }) => {
  // Sin ningún punto no hay mapa que valga la pena: ver el porqué en
  // BurbujaPedido.js, donde tampoco se monta sin esto.
  if (!punto && !destino) return null;

  const html = useMemo(
    () => paginaHtml(punto, destino, colorMarca),
    // Cambia de HTML solo cuando el punto se movió de verdad, no en cada
    // segundo que pasa: recrear el WebView entero por cada "tic" del reloj
    // haría parpadear el mapa en vez de solo mover el pin.
    [punto?.lat, punto?.lng, destino?.lat, destino?.lng, colorMarca]
  );

  return (
    <View style={[estilos.marco, { height: alto }]}>
      <WebView
        key={html}
        source={{ html }}
        style={estilos.webview}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
      />
      {/*
        Encima del WebView, sin pintar nada y sin onPress: alcanza con que
        exista para quedarse con el toque (una View normal ya es
        `pointerEvents: 'auto'` por defecto). En Android un WebView atrapa el
        toque aunque adentro nada sea arrastrable, y esto es una miniatura de
        reojo, no algo que explorar — mismo espíritu que `interactivo={false}`
        en la web, resuelto del lado nativo en vez de con una prop de Leaflet.
      */}
      <View style={estilos.capaToque} />
    </View>
  );
};

const estilos = StyleSheet.create({
  marco: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  capaToque: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapaSeguimiento;
