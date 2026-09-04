/*
 * ============================================================
 * UBICACIÓN — useUbicacion.js
 * ============================================================
 * Puerto de `frontend/src/hooks/useUbicacion.js`: coordenadas -> dirección
 * escrita, con Nominatim (el buscador de OpenStreetMap). Gratis y sin llave
 * — la razón está en el original: la llave de Google del proyecto responde
 * REQUEST_DENIED desde que venció el trial, y Maps exige facturación.
 *
 * No se porta `localizarme` ("usar mi ubicación"): eso pide el GPS del
 * teléfono, que en RN es `expo-location`, una segunda dependencia nueva que
 * no se pidió. El mapa se puede usar tocando y arrastrando el pin igual, sin
 * ese atajo.
 *
 * Nominatim pide no bombardearlo: por eso solo se consulta cuando se suelta
 * el pin (el mensaje que manda el mapa embebido en `ModalMapaDireccion`),
 * nunca en cada fotograma de un arrastre.
 *
 * ── El User-Agent, que la web no necesita y aquí sí ──
 * La política de uso de Nominatim exige que la petición se identifique con
 * un Referer o un User-Agent — en el navegador el Referer lo pone el
 * navegador solo, así que la web nunca tuvo que pensar en esto. `fetch` en
 * React Native no manda ninguno de los dos por su cuenta, y Nominatim
 * contesta 403 sin uno: se comprobó en el emulador antes de escribir esto,
 * no es una precaución de sobra.
 * ============================================================
 */

import { useState } from 'react';

// San Salvador: dónde abre el mapa si todavía no hay un pin puesto.
export const CENTRO_POR_DEFECTO = { lat: 13.6929, lng: -89.2182 };

/*
 * Coordenadas → dirección escrita. Se arma con las partes que le sirven a un
 * repartidor (calle, número, colonia, ciudad) y se descartan el país y el
 * código postal, que en una entrega de barrio no aportan nada.
 */
const direccionDesdeCoords = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'TiendaLa635-App/1.0' },
  });
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

export const useUbicacion = () => {
  const [posicion, setPosicion] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [avisoGeocod, setAvisoGeocod] = useState('');

  // Mueve el pin y trae la dirección de ese punto.
  const marcarEn = async ({ lat, lng }) => {
    setPosicion({ lat, lng });
    setBuscando(true);
    setAvisoGeocod('');
    try {
      const texto = await direccionDesdeCoords(lat, lng);
      if (texto) setDireccion(texto);
    } catch {
      /*
       * Sin internet o con Nominatim caído, el pin igual queda puesto y la
       * persona puede escribir la dirección a mano. Quedarse sin poder
       * continuar por un servicio ajeno sería peor.
       */
      setAvisoGeocod('No se pudo leer la dirección; puede escribirla usted');
    } finally {
      setBuscando(false);
    }
  };

  return { posicion, direccion, setDireccion, buscando, avisoGeocod, marcarEn };
};
