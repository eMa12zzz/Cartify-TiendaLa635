/*
 * ============================================================
 * MAPLIBRE PARA LOS WEBVIEW — lo que comparten los mapas de la app
 * ============================================================
 * La web usa mapcn (MapLibre con los mapas vectoriales de CARTO). Los mapas
 * de la app corren dentro de un WebView, así que aquí va lo mismo escrito
 * para una página HTML suelta: la librería, el estilo de mapa y los pines.
 *
 * Versión 5 y no la 6 de la web: la 5 viene en UN solo archivo que ya trae
 * su "worker" adentro. La 6 carga el worker como archivo aparte desde el CDN,
 * y un WebView sin dominio propio (source={{ html }}) no siempre lo deja.
 * El mapa se ve igual: el estilo es el mismo.
 *
 * Gratis y sin llave, igual que antes con Leaflet.
 * ============================================================
 */

const VERSION = '5.24.0';

export const MAPLIBRE_JS = `https://cdn.jsdelivr.net/npm/maplibre-gl@${VERSION}/dist/maplibre-gl.js`;
export const MAPLIBRE_CSS = `https://cdn.jsdelivr.net/npm/maplibre-gl@${VERSION}/dist/maplibre-gl.css`;

// El mismo estilo claro que usa mapcn en la web.
export const ESTILO_MAPA = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// El color de fondo del mapa mientras cargan las calles.
export const FONDO_MAPA = '#F2F1EE';

/*
 * Los pines y el crédito, igual que en la web (MapaTienda.jsx):
 * - la gota: cuadrado con tres esquinas redondas girado 45°;
 * - el repartidor: punto azul con halo que late;
 * - el crédito "© CARTO, © OpenStreetMap" plegado en su botón "i".
 */
export const cssComun = (colorMarca) => `
  html, body, #mapa { height: 100%; margin: 0; padding: 0; background: ${FONDO_MAPA}; }
  .pin-gota-caja { width: 26px; height: 26px; display: flex; align-items: flex-start; justify-content: center; }
  .pin-gota {
    width: 20px; height: 20px; border-radius: 50% 50% 50% 0;
    background: ${colorMarca}; transform: rotate(-45deg);
    border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,.3);
  }
  .pin-vivo { position: relative; width: 16px; height: 16px; }
  .pin-vivo::before {
    content: ''; position: absolute; inset: -6px; border-radius: 50%;
    background: rgba(37,99,235,.28); animation: latido 1.6s ease-out infinite;
  }
  .pin-vivo::after {
    content: ''; position: absolute; inset: 0; border-radius: 50%;
    background: #2563eb; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 0 5px rgba(37,99,235,.22), 0 2px 6px rgba(0,0,0,.3);
  }
  @keyframes latido { from { transform: scale(.6); opacity: 1; } to { transform: scale(1.8); opacity: 0; } }
  .maplibregl-ctrl-attrib { border-radius: 8px; font-size: 10px; }
  .maplibregl-ctrl-group { border-radius: 10px !important; }
`;

// Script: pliega el crédito cuando el mapa termina de cargar.
export const JS_PLEGAR_CREDITO = `
  function plegarCredito(mapa) {
    mapa.on('load', function () {
      var credito = document.querySelector('.maplibregl-ctrl-attrib');
      if (credito) credito.classList.remove('maplibregl-compact-show');
    });
  }
`;
