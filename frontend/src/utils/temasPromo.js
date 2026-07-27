/*
 * ============================================================
 * TEMAS DE BANNER — temasPromo.js
 * ============================================================
 * Paletas listas para las promociones.
 *
 * Por qué paletas y no un selector de color libre: quien arma la promo es el
 * tendero, no un diseñador. Pedirle un código hexadecimal es pedirle que
 * adivine, y el resultado suele ser texto ilegible sobre un fondo chillón.
 * Con paletas elige "Café" o "Fresco" y el contraste ya está resuelto.
 *
 * Igual queda "Personalizado" para quien sepa lo que hace.
 * ============================================================
 */

export const TEMAS = [
  {
    id: 'cafe',
    nombre: 'Café',
    fondo: 'linear-gradient(135deg, #8A5222 0%, #B46C30 100%)',
    texto: '#FFFFFF',
    acento: '#F3E7D8',
    muestra: '#B46C30',
  },
  {
    id: 'fresco',
    nombre: 'Fresco',
    fondo: 'linear-gradient(135deg, #1F6F4A 0%, #35A06B 100%)',
    texto: '#FFFFFF',
    acento: '#DFF3E7',
    muestra: '#2E8B5A',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    fondo: 'linear-gradient(135deg, #C2410C 0%, #F08400 100%)',
    texto: '#FFFFFF',
    acento: '#FFE9CC',
    muestra: '#E86A0C',
  },
  {
    id: 'noche',
    nombre: 'Noche',
    fondo: 'linear-gradient(135deg, #1C1614 0%, #3D322B 100%)',
    texto: '#FFFFFF',
    acento: '#D8A860',
    muestra: '#2A211C',
  },
  {
    id: 'cielo',
    nombre: 'Cielo',
    fondo: 'linear-gradient(135deg, #1E4E8C 0%, #3B82C4 100%)',
    texto: '#FFFFFF',
    acento: '#DCEBFA',
    muestra: '#2C68A8',
  },
  {
    id: 'crema',
    nombre: 'Crema',
    // La única clara: por eso lleva texto oscuro, si no no se lee nada.
    fondo: 'linear-gradient(135deg, #FBF6F0 0%, #EDE0CE 100%)',
    texto: '#3D2B1A',
    acento: '#B46C30',
    muestra: '#EDE0CE',
  },
];

const POR_DEFECTO = TEMAS[0];

/*
 * Devuelve los colores que hay que pintar. Si la promo eligió "personalizado"
 * usa los suyos; si no, los del tema. Siempre devuelve algo pintable, aunque
 * la promo venga incompleta de la base.
 */
export const coloresDePromo = (promo) => {
  if (!promo) return POR_DEFECTO;

  if (promo.tema === 'personalizado' && promo.colorFondo) {
    return {
      id: 'personalizado',
      nombre: 'Personalizado',
      fondo: promo.colorFondo,
      texto: promo.colorTexto || '#FFFFFF',
      acento: promo.colorAcento || '#FFFFFF',
      muestra: promo.colorFondo,
    };
  }

  return TEMAS.find((t) => t.id === promo.tema) || POR_DEFECTO;
};
