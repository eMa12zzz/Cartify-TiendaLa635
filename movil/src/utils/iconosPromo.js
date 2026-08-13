/*
 * ============================================================
 * ICONOS DE PROMOCIÓN — iconosPromo.js
 * ============================================================
 * Un puñado de iconos para que el banner diga de qué va sin leerlo. Los mismos
 * dieciséis que ofrece el panel en `frontend/src/utils/iconosPromo.js`, porque
 * el id que eligió el tendero se guarda en la promo y tiene que significar lo
 * mismo en los dos lados: si aquí faltara "helado", la promo de helados se
 * vería sin icono solo en el teléfono.
 *
 * ── Por qué estos NO se dibujan a mano ──
 *
 * El resto de los iconos de la app son `View`s (ver UI/Iconos.js), y la razón
 * que se dio entonces fue no traer una librería de iconos por siete formas
 * geométricas. Aquí son dieciséis, y varias —el croissant, el helado, la
 * canasta— no son formas geométricas: dibujarlas con rectángulos y círculos da
 * un resultado pobre y doscientas líneas.
 *
 * Y sobre todo: `@expo/vector-icons` ya venía dentro de `expo`, anidado en sus
 * node_modules. No es una librería nueva que entra al proyecto, es una que ya
 * estaba y que solo hacía falta dejar alcanzable.
 *
 * MaterialCommunityIcons y no otra familia porque es la que tiene los dieciséis
 * conceptos —incluidos "croissant" y "cup" — sin obligar a mezclar dos juegos
 * de iconos con grosores de línea distintos en la misma tarjeta.
 * ============================================================
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/*
 * El id es el que guarda la promo (lo pone el panel) y el nombre es el glifo
 * de MaterialCommunityIcons. Los nombres están verificados contra el glyphmap
 * del paquete: uno inventado no avisa, simplemente pinta un cuadro vacío.
 */
export const ICONOS_PROMO = {
  llama: 'fire',
  chispa: 'shimmer',
  estrella: 'star-outline',
  porcentaje: 'percent-outline',
  etiqueta: 'tag-outline',
  regalo: 'gift-outline',
  corazon: 'heart-outline',
  canasta: 'basket-outline',
  bebida: 'cup-outline',
  cafe: 'coffee-outline',
  fruta: 'food-apple-outline',
  verdura: 'leaf',
  lacteo: 'bottle-soda-classic-outline',
  galleta: 'cookie-outline',
  pan: 'baguette',
  helado: 'ice-cream',
};

/*
 * El nombre del glifo elegido, o null si la promo no lleva icono. Null es un
 * resultado normal: el icono es opcional en el panel.
 */
export const glifoDePromo = (id) => ICONOS_PROMO[id] || null;

export { MaterialCommunityIcons };
