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
 * OJO: MapLibre ordena las coordenadas como [lng, lat].
 * ============================================================
 */

import { MAPLIBRE_CSS, MAPLIBRE_JS, JS_PLEGAR_CREDITO, cssComun, estiloMapa } from '../UI/mapaMapLibre';

export const crearHtmlSeguimiento = ({ punto, destino, colorMarca, interactivo = false, oscuro = false }) => `<!DOCTYPE html>
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

    // Mismo encuadre en las dos versiones: los dos puntos a la vez si hay
    // los dos, y se va cerrando solo conforme el repartidor se acerca a la
    // casa. En la versión grande el cliente puede alejarlo a mano después.
    if (punto && destino) {
      mapa.fitBounds(
        [
          [Math.min(punto.lng, destino.lng), Math.min(punto.lat, destino.lat)],
          [Math.max(punto.lng, destino.lng), Math.max(punto.lat, destino.lat)],
        ],
        // En el mapa grande los botones de zoom van abajo a la derecha: más
        // margen de ese lado para que no tapen al repartidor.
        { padding: interactivo ? { top: 40, left: 40, right: 70, bottom: 80 } : 34, maxZoom: 16, duration: 0 }
      );
    }
  </script>
</body>
</html>`;
