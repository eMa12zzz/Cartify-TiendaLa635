/*
 * ============================================================
 * DATOS DE LA TIENDA — tienda.js
 * ============================================================
 * Copia chica de `frontend/src/utils/tienda.js`: solo lo que hace falta acá,
 * la dirección para "pasar a la tienda" y el WhatsApp para el botón de
 * contacto en Ayuda.js. El nombre y el logo NO están aquí — esos sí salen
 * del backend, ver useAjustesTienda.js.
 *
 * La dirección va escrita a mano, igual que en la web: cuando exista la
 * pantalla de Personalización en el panel, los dos archivos pasan a leerla
 * del servidor a la vez.
 */

export const DIRECCION_EN_UNA_LINEA = 'Calle Sevilla 635, Col. Providencia';

/*
 * El WhatsApp sale de `EXPO_PUBLIC_WHATSAPP` (ver .env.example), la versión
 * de Expo del `VITE_WHATSAPP` que ya usa la web — mismo formato: solo
 * dígitos, 503 + los 8 del número. Sin configurar, queda vacío y quien lo
 * use simplemente no pinta el botón: uno que no lleva a ningún lado es peor
 * que no tener botón.
 */
export const WHATSAPP = (process.env.EXPO_PUBLIC_WHATSAPP || '').replace(/\D/g, '');

export const enlaceWhatsApp = (mensaje) =>
  WHATSAPP
    ? `https://wa.me/${WHATSAPP}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
    : null;
