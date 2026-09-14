/*
 * ============================================================
 * MAPA DE SEGUIMIENTO — la página que corre DENTRO del WebView
 * ============================================================
 * Mismo Leaflet + teselas de OpenStreetMap que `mapaLeafletHtml.js` (el mapa
 * de marcar dirección) — en un archivo aparte porque este pinta DOS pines
 * (repartidor y casa) y encuadra los dos a la vez, en vez de uno solo
 * arrastrable.
 *
 * `interactivo` decide si es la miniatura de reojo que usa
 * `MapaSeguimiento.js` (zoom y arrastre apagados) o el mapa grande que
 * `ModalMapaSeguimiento.js` abre al tocarla (zoom y arrastre de verdad,
 * igual que el de marcar dirección) — las DOS usan este mismo generador,
 * para que los pines no puedan desalinearse entre una versión y la otra.
 * ============================================================
 */

export const crearHtmlSeguimiento = ({ punto, destino, colorMarca, interactivo = false }) => `<!DOCTYPE html>
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
      zoomControl: ${!!interactivo},
      attributionControl: ${!!interactivo},
      dragging: ${!!interactivo},
      scrollWheelZoom: ${!!interactivo},
      doubleClickZoom: ${!!interactivo},
      boxZoom: ${!!interactivo},
      keyboard: ${!!interactivo},
      tap: ${!!interactivo},
    }).setView([centro.lat, centro.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);

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

    // Mismo encuadre en las dos versiones: los dos puntos a la vez si hay
    // los dos, y se va cerrando solo conforme el repartidor se acerca a la
    // casa. En la versión grande el cliente puede alejarlo a mano después.
    if (punto && destino) {
      mapa.fitBounds(L.latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
        padding: [34, 34],
        maxZoom: 16,
      });
    }
  </script>
</body>
</html>`;
