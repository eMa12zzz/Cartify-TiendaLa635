/*
 * ============================================================
 * FOTOS AL TAMAÑO EN QUE SE VEN — fotos.js
 * ============================================================
 * Las fotos de los productos y las promociones viven en Cloudinary, y la
 * tienda las pedía tal cual se subieron: la de las fresas pesaba 667 KB para
 * dibujarse en un cuadro de 165 px. Toda la portada eran 11 MB, casi todo
 * fotos, y en un teléfono con datos eso es esperar y pagar.
 *
 * Cloudinary las entrega transformadas si se le pide en la dirección:
 *   f_auto   el mejor formato que entienda el navegador (AVIF o WebP)
 *   q_auto   la calidad más baja que el ojo no nota
 *   c_limit  achica hasta `ancho`, nunca agranda
 *   w_N      el ancho pedido
 * La misma foto de las fresas, a 400 px, pesa 41 KB: dieciséis veces menos.
 *
 * `ancho` es el DOBLE de lo que mide en pantalla, para que se vea nítida en
 * pantallas de alta densidad (casi todos los teléfonos).
 *
 * Lo que no es de Cloudinary (una foto de Google, una vista previa local
 * blob:, una dirección vacía) se devuelve igual: aquí solo se optimiza, nunca
 * se rompe una imagen.
 * ============================================================
 */

const SUBIDA = '/image/upload/';

// Los anchos de la tienda, para no regar números sueltos por los componentes.
export const ANCHO = {
  miniatura: 160, // carrito, asistente, seguimiento del pedido
  tarjeta: 400, // tarjetas de producto y favoritos
  ficha: 900, // la ficha grande del producto
  promo: 1000, // tarjetas y detalle de las promociones
};

export const foto = (url, ancho) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(SUBIDA)) {
    return url;
  }
  // Si ya trae transformaciones (alguien la pidió a su medida), se respeta.
  const despues = url.split(SUBIDA)[1] || '';
  if (/^[a-z]{1,3}_[^/]*\//.test(despues)) return url;
  return url.replace(SUBIDA, `${SUBIDA}f_auto,q_auto,c_limit,w_${ancho}/`);
};
