import { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/*
 * MapaLeaflet — el MISMO mapa del frontend, dentro de un WebView.
 *
 * La web usa react-leaflet (Leaflet + tiles de OpenStreetMap). En vez de un
 * mapa nativo (react-native-maps, que en Android necesita development build),
 * aquí se carga Leaflet de verdad dentro de un WebView: se ve IGUAL que la web,
 * con el mismo pin, las mismas tiles de OSM, y CORRE EN EXPO GO.
 *
 * Props:
 *   centro  { latitude, longitude }  — dónde abre el mapa.
 *   coord   { latitude, longitude }  — el pin (si ya hay uno elegido).
 *   onMove  (coord) => void          — avisa cuando se mueve el pin (tocar o arrastrar).
 */
export default function MapaLeaflet({ centro, coord, onMove }) {
  const ref = useRef(null);
  const inicial = coord || centro;

  // El HTML se arma UNA vez con el centro inicial; los cambios de pin que
  // vienen de fuera (GPS) se mandan con injectJavaScript, sin recargar el mapa.
  const html = useMemo(() => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>html,body,#map{height:100%;margin:0;padding:0}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var lat = ${inicial.latitude}, lng = ${inicial.longitude};
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lng], 16);
    /*
     * Tiles de OpenStreetMap, host canónico SIN subdominios: OSM deprecó los
     * a/b/c.tile y pedirlos así cuenta como violar su política de uso, lo que
     * dispara el famoso 418 ("I'm a teapot") y deja el mapa en gris. El otro
     * requisito —un User-Agent que identifique la app— lo pone el WebView con
     * su prop userAgent; sin él, OSM ve el UA de navegador falso del WebView
     * de Android y también responde 418.
     */
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // El MISMO pin del frontend: gota café con borde blanco.
    var icono = L.divIcon({
      className: '',
      html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#B46C30;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35)"></div>',
      iconSize: [26, 26], iconAnchor: [13, 26],
    });

    var marker = ${coord ? `L.marker([lat,lng],{draggable:true,icon:icono}).addTo(map)` : 'null'};

    function emitir(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: latlng.lat, lng: latlng.lng }));
    }
    function ponerPin(latlng) {
      if (marker) { marker.setLatLng(latlng); }
      else { marker = L.marker(latlng, { draggable: true, icon: icono }).addTo(map); marker.on('dragend', function(e){ emitir(e.target.getLatLng()); }); }
    }
    if (marker) { marker.on('dragend', function(e){ emitir(e.target.getLatLng()); }); }
    map.on('click', function(e) { ponerPin(e.latlng); emitir(e.latlng); });

    // Recibir un pin nuevo desde React Native (ej. "usar mi ubicación").
    function alRecibir(ev) {
      try {
        var d = JSON.parse(ev.data);
        if (d && d.lat != null) { ponerPin([d.lat, d.lng]); map.setView([d.lat, d.lng], 16); }
      } catch (e) {}
    }
    document.addEventListener('message', alRecibir);
    window.addEventListener('message', alRecibir);
  </script>
</body>
</html>`, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando el pin cambia desde fuera (GPS), se lo pasamos al mapa.
  useEffect(() => {
    if (!coord || !ref.current) return;
    ref.current.postMessage(JSON.stringify({ lat: coord.latitude, lng: coord.longitude }));
  }, [coord?.latitude, coord?.longitude]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        // El baseUrl le da un "referer" real a las peticiones: sin él, OSM y
        // unpkg pueden responder 404/403 a un WebView con html suelto.
        source={{ html, baseUrl: 'https://www.openstreetmap.org/' }}
        /*
         * User-Agent que identifica la app, como pide la política de tiles de
         * OSM. El WebView de Android manda por defecto un UA de navegador con
         * el marcador "; wv" que OSM trata como navegador falso y bloquea con
         * 418; con este UA propio las tiles cargan.
         */
        userAgent="TiendaLa635/1.0 (contacto@tiendala635.com)"
        style={styles.web}
        onMessage={(e) => {
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (d?.lat != null) onMove?.({ latitude: d.lat, longitude: d.lng });
          } catch { /* ignora */ }
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#e8e8e8' },
});
