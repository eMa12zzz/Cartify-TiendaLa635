/*
 * ============================================================
 * COSTO DE ENVÍO POR DISTANCIA — envio.js
 * ============================================================
 * Calcula cuánto cuesta llevar un pedido a una dirección. Sin APIs de pago ni
 * Google: la distancia se saca con la fórmula de haversine (dos coordenadas y
 * trigonometría), gratis y sin internet.
 *
 * El precio se decide de MÁS específico a MÁS general:
 *   1. Zona: si la dirección cae dentro de una zonaEnvio (un círculo con precio
 *      fijo), manda ese precio. Si cae en varias, gana la de radio más chico.
 *   2. Por km: envioBase + envioPorKm × distancia desde la tienda.
 *   3. Plano: si no se puede medir (falta la ubicación de la tienda o del
 *      cliente), se cae al costoEnvio de siempre. Así una tienda que no
 *      configura nada sigue funcionando igual que antes.
 * ============================================================
 */

const RADIO_TIERRA_KM = 6371;
const rad = (g) => (g * Math.PI) / 180;

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
// Ojo: Number(null) === 0, así que un coord vacío (null/''/undefined) NO se puede
// tratar como número, o una dirección sin punto se leería como (0,0) en el mar.
const esCoord = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const hayCoord = (lat, lng) => esCoord(lat) && esCoord(lng);
const redondear = (n) => Number(num(n, 0).toFixed(2));

// Distancia en km entre dos puntos (haversine).
export const distanciaKm = (lat1, lng1, lat2, lng2) => {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/*
 * Devuelve el costo de envío a una dirección, con el desglose de cómo se
 * calculó (útil para mostrárselo al cliente: "$2.50 · a 3 km").
 *
 * ajustes: documento de storeSettings (ubicacionTienda, envioBase, envioPorKm,
 *          zonasEnvio, costoEnvio).
 * destino: { lat, lng } de la dirección del cliente (puede venir sin coords).
 */
export const calcularEnvio = (ajustes = {}, destino = {}) => {
  const base = num(ajustes.envioBase, 1);
  const porKm = num(ajustes.envioPorKm, 0.5);
  const plano = num(ajustes.costoEnvio, 4.78);
  const zonas = Array.isArray(ajustes.zonasEnvio) ? ajustes.zonasEnvio : [];
  const tienda = ajustes.ubicacionTienda || {};
  const lat = destino?.lat;
  const lng = destino?.lng;

  // Sin coordenadas del cliente no hay cómo medir: tarifa plana de siempre.
  if (!hayCoord(lat, lng)) {
    return { costo: redondear(plano), metodo: "plano", distanciaKm: null, zona: null };
  }

  // 1. ¿Cae dentro de alguna zona? Gana la más específica (radio más chico).
  const dentro = zonas
    .filter((z) => hayCoord(z.lat, z.lng) && distanciaKm(lat, lng, z.lat, z.lng) <= num(z.radioKm, 1))
    .sort((a, b) => num(a.radioKm, 1) - num(b.radioKm, 1))[0];
  if (dentro) {
    return { costo: redondear(dentro.precio), metodo: "zona", distanciaKm: null, zona: dentro.nombre };
  }

  // 2. Fórmula por km, si la tienda tiene su ubicación fijada.
  if (hayCoord(tienda.lat, tienda.lng)) {
    const km = distanciaKm(tienda.lat, tienda.lng, lat, lng);
    return {
      costo: redondear(base + porKm * km),
      metodo: "km",
      distanciaKm: Math.round(km * 10) / 10,
      zona: null,
    };
  }

  // 3. Sin ubicación de la tienda: tarifa plana.
  return { costo: redondear(plano), metodo: "plano", distanciaKm: null, zona: null };
};
