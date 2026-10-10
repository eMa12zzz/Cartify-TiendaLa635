/*
 * ============================================================
 * MAPA DE SEGUIMIENTO — la página que corre DENTRO del WebView
 * ============================================================
 * Mismo MapLibre + estilo de CARTO que `mapaDireccionHtml.js` (el mapa de
 * marcar dirección) y que la web — en un archivo aparte porque este pinta DOS
 * pines (repartidor y casa) y encuadra los dos a la vez, en vez de uno solo
 * arrastrable.
 *
 * `interactivo` decide si es la miniatura de reojo que usa
 * `MapaSeguimiento.js` (zoom y arrastre apagados) o el mapa grande que
 * `ModalMapaSeguimiento.js` abre al tocarla (zoom y arrastre de verdad,
 * igual que el de marcar dirección) — las DOS usan este mismo generador,
 * para que los pines no puedan desalinearse entre una versión y la otra.
 *
 * `ruta` ([{lat,lng}…]) es la línea por las calles que le falta al
 * repartidor, la misma que dibuja la web (ver backend/src/utils/rutaReparto.js).
 * Va en el azul de su punto, con un borde del color de las calles debajo, y el
 * encuadre la abarca entera.
 *
 * OJO: MapLibre ordena las coordenadas como [lng, lat].
 * ============================================================
 */

import { MAPLIBRE_CSS, MAPLIBRE_JS, JS_PLEGAR_CREDITO, cssComun, estiloMapa } from '../UI/mapaMapLibre';

const esCoord = (p) => !!p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));

export const crearHtmlSeguimiento = ({ punto, destino, ruta, colorMarca, interactivo = false, oscuro = false }) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${MAPLIBRE_CSS}" />
  <style>${cssComun(colorMarca, oscuro)}</style>
</head>
<body>
  <div id="mapa"></div>
  <script src="${MAPLIBRE_JS}"></script>
  <script>
    ${JS_PLEGAR_CREDITO}

    var punto = ${punto ? JSON.stringify(punto) : 'null'};
    var destino = ${destino ? JSON.stringify(destino) : 'null'};
    var ruta = ${Array.isArray(ruta) && ruta.filter(esCoord).length > 1
      ? JSON.stringify(ruta.filter(esCoord).map((p) => [Number(p.lng), Number(p.lat)]))
      : 'null'};
    var centro = punto || destino;
    var interactivo = ${!!interactivo};

    var mapa = new maplibregl.Map({
      container: 'mapa',
      style: '${estiloMapa(oscuro)}',
      center: [centro.lng, centro.lat],
      zoom: 15,
      interactive: interactivo,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    if (interactivo) {
      mapa.touchZoomRotate.disableRotation();
      mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    }
    plegarCredito(mapa);

    function pin(clase) {
      var caja = document.createElement('div');
      if (clase === 'pin-gota') {
        caja.className = 'pin-gota-caja';
        var gota = document.createElement('div');
        gota.className = 'pin-gota';
        caja.appendChild(gota);
      } else {
        caja.className = clase;
      }
      return caja;
    }

    if (destino) {
      new maplibregl.Marker({ element: pin('pin-gota'), anchor: 'bottom' })
        .setLngLat([destino.lng, destino.lat]).addTo(mapa);
    }
    if (punto) {
      new maplibregl.Marker({ element: pin('pin-vivo'), anchor: 'center' })
        .setLngLat([punto.lng, punto.lat]).addTo(mapa);
    }

    // La ruta por las calles, debajo de los pines (que son elementos aparte).
    if (ruta) {
      mapa.on('load', function () {
        mapa.addSource('ruta', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ruta } },
        });
        var trazo = { 'line-join': 'round', 'line-cap': 'round' };
        mapa.addLayer({ id: 'ruta-borde', type: 'line', source: 'ruta', layout: trazo,
          paint: { 'line-color': '${oscuro ? '#0F172A' : '#FFFFFF'}', 'line-width': 8, 'line-opacity': 0.95 } });
        mapa.addLayer({ id: 'ruta', type: 'line', source: 'ruta', layout: trazo,
          paint: { 'line-color': '#2563eb', 'line-width': 4.5, 'line-opacity': 0.95 } });
      });
    }

    // Mismo encuadre en las dos versiones: los dos puntos a la vez si hay
    // los dos (y la ruta entera, que puede dar la vuelta por fuera de ese
    // rectángulo), y se va cerrando solo conforme el repartidor se acerca a la
    // casa. En la versión grande el cliente puede alejarlo a mano después.
    if (punto && destino) {
      var todos = [[punto.lng, punto.lat], [destino.lng, destino.lat]].concat(ruta || []);
      var lngs = todos.map(function (p) { return p[0]; });
      var lats = todos.map(function (p) { return p[1]; });
      mapa.fitBounds(
        [
          [Math.min.apply(null, lngs), Math.min.apply(null, lats)],
          [Math.max.apply(null, lngs), Math.max.apply(null, lats)],
        ],
        // En el mapa grande los botones de zoom van abajo a la derecha: más
        // margen de ese lado para que no tapen al repartidor.
        { padding: interactivo ? { top: 40, left: 40, right: 70, bottom: 80 } : 34, maxZoom: 16, duration: 0 }
      );
    }
  </script>
</body>
</html>`;
