/*
 * ============================================================
 * DATOS DE LA TIENDA — tienda.js
 * ============================================================
 * Puerto de `frontend/src/utils/tienda.js`. El nombre, la dirección y el
 * contacto de La 635 en UN solo lugar. Los usa el Centro de ayuda.
 *
 * ── Única diferencia con la web ──
 * La web lee el WhatsApp de `import.meta.env.VITE_WHATSAPP` (variable de Vite),
 * que en React Native no existe. Aquí se pone a mano abajo, igual que el
 * HOST_MANUAL de api.js. Si se deja vacío, el Centro de ayuda simplemente no
 * pinta el botón de WhatsApp — un botón que no lleva a nadie es peor que
 * ninguno.
 * ============================================================
 */

// Formato internacional sin signos: El Salvador es 503 + los 8 dígitos.
// Ejemplo: const WHATSAPP_MANUAL = '50378901234';
const WHATSAPP_MANUAL = '';

// Las dos líneas del nombre (se apilan con el mismo peso: "Tienda" es parte
// del nombre del negocio, no una etiqueta).
export const NOMBRE_TIENDA = { arriba: 'Tienda', abajo: 'la 635' };
export const NOMBRE_COMPLETO = 'Tienda la 635';

// De aquí salen los repartos y aquí llega quien pase comprando.
export const DIRECCION_TIENDA = {
  calle: 'Calle Sevilla 635',
  colonia: 'Col. Providencia',
  pais: 'El Salvador',
};

export const DIRECCION_EN_UNA_LINEA = `${DIRECCION_TIENDA.calle}, ${DIRECCION_TIENDA.colonia}`;

export const WHATSAPP = String(WHATSAPP_MANUAL || '').replace(/\D/g, '');

export const enlaceWhatsApp = (mensaje) =>
  WHATSAPP
    ? `https://wa.me/${WHATSAPP}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
    : null;
