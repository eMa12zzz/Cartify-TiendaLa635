/*
 * ============================================================
 * MAPA LEAFLET — la página que corre DENTRO del WebView
 * ============================================================
 * React Native no tiene una vista de mapa propia sin agregar una librería
 * nativa (ver el comentario grande en ModalMapaDireccion.js). Esta pantalla
 * hace justo lo que `frontend/src/components/Store/MapaDireccion.jsx` pinta
 * con react-leaflet, pero escrito a mano en HTML/JS plano: mismo Leaflet,
 * mismas teselas de OpenStreetMap, mismo pin con forma de gota.
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
 * ============================================================
 */

export const crearHtmlMapa = ({ colorPin, centro }) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; }
    .pin-gota {
      width: 20px; height: 20px; border-radius: 50% 50% 50% 0;
      background: ${colorPin}; transform: rotate(-45deg);
      border: 2.5px solid #fff; box-shadow: 0 3px 7px rgba(0,0,0,.3);
    }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const centro = [${centro.lat}, ${centro.lng}];
    const mapa = L.map('mapa', { zoomControl: true }).setView(centro, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);

    const icono = L.divIcon({
      className: '',
      html: '<div class="pin-gota"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    let marcador = null;

    const avisarPosicion = (lat, lng) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
    };

    const ponerPin = (lat, lng) => {
      if (marcador) {
        marcador.setLatLng([lat, lng]);
      } else {
        marcador = L.marker([lat, lng], { icon: icono, draggable: true }).addTo(mapa);
        marcador.on('dragend', () => {
          const p = marcador.getLatLng();
          avisarPosicion(p.lat, p.lng);
        });
      }
      mapa.setView([lat, lng], Math.max(mapa.getZoom(), 16));
    };

    // Tocar el mapa mueve el pin. Es la forma natural de decir "aquí".
    mapa.on('click', (e) => {
      ponerPin(e.latlng.lat, e.latlng.lng);
      avisarPosicion(e.latlng.lat, e.latlng.lng);
    });

    // Ver el comentario grande de arriba: esto lo llama RN, el mapa no lo llama solo.
    window.marcarPinExterno = function (lat, lng) {
      ponerPin(lat, lng);
    };
  </script>
</body>
</html>`;
