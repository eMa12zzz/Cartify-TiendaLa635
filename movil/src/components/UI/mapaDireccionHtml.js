/*
 * ============================================================
 * MAPA PARA MARCAR LA DIRECCIÓN — la página que corre DENTRO del WebView
 * ============================================================
 * Hace lo mismo que `frontend/src/components/Store/MapaDireccion.jsx`: el
 * mismo MapLibre, el mismo estilo de CARTO y el mismo pin con forma de gota
 * (ver mapaMapLibre.js), pero escrito en HTML/JS plano porque vive en un
 * WebView (ver el comentario grande en ModalMapaDireccion.js).
 *
 * ── Cómo habla con la pantalla nativa ──
 * Esto vive en un mundo aparte (el WebView), así que no puede llamar
 * funciones de React directo. La única salida es
 * `window.ReactNativeWebView.postMessage(texto)`: cada vez que se toca el
 * mapa o se suelta el pin arrastrado, manda `{lat, lng}` como JSON. Del otro
 * lado, `ModalMapaDireccion` lo recibe en `onMessage` y sigue desde ahí
 * (pide la dirección a Nominatim, etc.) — este archivo no sabe nada de eso.
 *
 * El camino inverso (RN → mapa) es `window.marcarPinExterno(lat, lng)`, que
 * ModalMapaDireccion llama con `injectJavaScript` cuando la posición cambió
 * por el botón de "Dirección actual" en vez de un toque: el GPS lo resuelve
 * React Native (con expo-location), y el mapa solo necesita enterarse de
 * dónde quedó el pin para centrarse ahí — no vuelve a avisar la posición
 * hacia afuera, porque RN ya la tiene.
 *
 * OJO: MapLibre ordena las coordenadas como [lng, lat]; hacia afuera siempre
 * se habla en {lat, lng}.
 * ============================================================
 */

import { MAPLIBRE_CSS, MAPLIBRE_JS, JS_PLEGAR_CREDITO, cssComun, estiloMapa } from './mapaMapLibre';

export const crearHtmlMapa = ({ colorPin, centro, oscuro = false }) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${MAPLIBRE_CSS}" />
  <style>${cssComun(colorPin, oscuro)}</style>
</head>
<body>
  <div id="mapa"></div>
  <script src="${MAPLIBRE_JS}"></script>
  <script>
    ${JS_PLEGAR_CREDITO}

    var mapa = new maplibregl.Map({
      container: 'mapa',
      style: '${estiloMapa(oscuro)}',
      center: [${centro.lng}, ${centro.lat}],
      zoom: 13,
      attributionControl: { compact: true },
      // Girar el mapa con dos dedos desorienta al marcar un portón.
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapa.touchZoomRotate.disableRotation();
    mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    plegarCredito(mapa);

    var marcador = null;

    function avisarPosicion(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
      }
    }

    function crearPin() {
      var caja = document.createElement('div');
      caja.className = 'pin-gota-caja';
      var gota = document.createElement('div');
      gota.className = 'pin-gota';
      caja.appendChild(gota);
      return caja;
    }

    function ponerPin(lat, lng) {
      if (marcador) {
        marcador.setLngLat([lng, lat]);
      } else {
        marcador = new maplibregl.Marker({ element: crearPin(), anchor: 'bottom', draggable: true })
          .setLngLat([lng, lat])
          .addTo(mapa);
        marcador.on('dragend', function () {
          var p = marcador.getLngLat();
          avisarPosicion(p.lat, p.lng);
        });
      }
      mapa.easeTo({ center: [lng, lat], zoom: Math.max(mapa.getZoom(), 16), duration: 400 });
    }

    // Tocar el mapa mueve el pin. Es la forma natural de decir "aquí".
    mapa.on('click', function (e) {
      ponerPin(e.lngLat.lat, e.lngLat.lng);
      avisarPosicion(e.lngLat.lat, e.lngLat.lng);
    });

    // Ver el comentario grande de arriba: esto lo llama RN, el mapa no lo llama solo.
    window.marcarPinExterno = function (lat, lng) {
      ponerPin(lat, lng);
    };
  </script>
</body>
</html>`;
