/*
 * ============================================================
 * DATOS DE LA TIENDA — tienda.js
 * ============================================================
 * El nombre, la dirección y el contacto de La 635, en UN solo lugar.
 *
 * Antes esto vivía repartido: el nombre escrito a mano en el encabezado, en el
 * sidebar del panel y en el pie; la dirección, en ningún lado. Cambiar algo
 * obligaba a acordarse de todos los archivos que lo mencionaban, y siempre se
 * escapaba uno.
 *
 * Ojo con lo que NO está aquí: horarios, correo y redes sociales. No están
 * porque no los tenemos, y un pie de página que anuncia "Lun a Sáb 7am-8pm"
 * inventado es peor que uno que no dice nada — el cliente llega a las 7 y se
 * encuentra la cortina abajo.
 *
 * Cuando exista la pantalla de Apariencia (los ajustes de la tienda), estos
 * valores pasan a salir de la base y este archivo queda como respaldo para
 * cuando el servidor no conteste.
 * ============================================================
 */

// Las dos líneas del nombre. Van separadas porque en el encabezado y en el pie
// se apilan, con el MISMO peso y color: "Tienda" no es una etiqueta que
// acompaña, es parte del nombre del negocio.
export const NOMBRE_TIENDA = { arriba: 'Tienda', abajo: 'la 635' };

export const NOMBRE_COMPLETO = 'Tienda la 635';

// De aquí salen los repartos y aquí llega quien quiera pasar comprando.
export const DIRECCION_TIENDA = {
  calle: 'Calle Sevilla 635',
  colonia: 'Col. Providencia',
  pais: 'El Salvador',
};

export const DIRECCION_EN_UNA_LINEA = `${DIRECCION_TIENDA.calle}, ${DIRECCION_TIENDA.colonia}`;

/*
 * El WhatsApp sale del .env (VITE_WHATSAPP), igual que en el botón flotante:
 * formato internacional sin signos, El Salvador es 503 + los 8 dígitos.
 * Si no está configurado queda vacío, y quien lo consuma simplemente no pinta
 * el enlace. Un botón de WhatsApp que no lleva a ningún lado es peor que no
 * tener botón.
 */
export const WHATSAPP = (import.meta.env.VITE_WHATSAPP || '').replace(/\D/g, '');

export const enlaceWhatsApp = (mensaje) =>
  WHATSAPP
    ? `https://wa.me/${WHATSAPP}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
    : null;
