/*
 * Las fotos de producto que salen en la bienvenida (Onboarding.js).
 *
 * Son las MISMAS fotos del catálogo de la tienda (Cloudinary), bajadas una vez
 * a 420px y guardadas en assets/onboarding: la bienvenida se ve la primera
 * vez que alguien abre la app, cuando todavía no hay catálogo cargado (el
 * backend de Render puede tardar en despertar), y una foto que aparece a
 * medias arruina la entrada en cascada. Empaquetadas, salen al instante y sin
 * red.
 */
export const FOTOS = {
  manzana: require('../../../assets/onboarding/manzana.webp'),
  sandia: require('../../../assets/onboarding/sandia.webp'),
  pera: require('../../../assets/onboarding/pera.webp'),
  uvas: require('../../../assets/onboarding/uvas.webp'),
  leche: require('../../../assets/onboarding/leche.webp'),
  cocacola: require('../../../assets/onboarding/cocacola.webp'),
  sprite: require('../../../assets/onboarding/sprite.webp'),
  cheetos: require('../../../assets/onboarding/cheetos.webp'),
  takis: require('../../../assets/onboarding/takis.webp'),
  pringles: require('../../../assets/onboarding/pringles.webp'),
};

export default FOTOS;
