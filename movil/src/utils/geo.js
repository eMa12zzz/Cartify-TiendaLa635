/*
 * ============================================================
 * UBICACIÓN — geo.js
 * ============================================================
 * Puerto de `frontend/src/hooks/useUbicacion.js` (la parte de geocodificación).
 * Traduce coordenadas a una dirección escrita con Nominatim (OpenStreetMap),
 * EXACTAMENTE como la web — así el mapa del móvil se comporta igual: mismas
 * tiles de OSM y misma forma de leer la dirección (calle, número, colonia,
 * ciudad; sin país ni código postal, que en una entrega de barrio no aportan).
 *
 * Nominatim pide no bombardearlo: por eso solo se consulta cuando la persona
 * suelta el pin o pide su ubicación, nunca mientras arrastra el mapa.
 * ============================================================
 */

// San Salvador: dónde abre el mapa si aún no sabemos dónde está la persona.
export const CENTRO_POR_DEFECTO = { latitude: 13.6929, longitude: -89.2182 };

// La URL de las tiles de OpenStreetMap, las MISMAS que usa react-leaflet.
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const direccionDesdeCoords = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('No se pudo leer la dirección');

  const d = await r.json();
  const a = d.address || {};
  const partes = [
    [a.road, a.house_number].filter(Boolean).join(' '),
    a.neighbourhood || a.suburb || a.residential,
    a.city || a.town || a.village || a.municipality,
  ].filter(Boolean);

  return partes.join(', ') || d.display_name || '';
};
