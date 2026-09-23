/*
 * ============================================================
 * LOS DISFRACES DE TIQUI — disfracesTiqui.js
 * ============================================================
 * Tiqui se viste según la temporada que tenga puesta la tienda: gorro
 * navideño en diciembre, sombrero de bruja en Halloween, corbatín azul y
 * blanco para las fiestas patrias...
 *
 * Tiqui NO cambia de color con la temporada, y eso sigue igual: es navy con
 * rasgos blancos (o al revés en modo oscuro) todo el año, porque es la cara
 * de la tienda. Lo que cambia es lo que LLEVA PUESTO, que es como se nota una
 * fecha en una persona: nadie se pinta de verde en Navidad, se pone el gorro.
 *
 * Aquí solo se decide QUÉ disfraz y de qué colores. Cómo se dibuja cada uno
 * vive en components/UI/DisfrazTiqui.jsx.
 * ============================================================
 */

/*
 * Los de fábrica tienen su disfraz pensado a mano, con colores fijos: el
 * gorro de Santa es rojo aunque la temporada pinte la tienda de verde pino.
 */
const DE_FABRICA = {
  navidad: { tipo: 'gorro-navidad', principal: '#C1121F', acento: '#FFFFFF' },
  halloween: { tipo: 'sombrero-bruja', principal: '#4C1D95', acento: '#EA580C' },
  // Los colores de la bandera: las alas azules y el nudo blanco en medio.
  independencia: { tipo: 'corbatin', principal: '#0F47AF', acento: '#FFFFFF' },
  // `rubor`: además del moño, anda con los cachetes colorados.
  'san-valentin': { tipo: 'mono', principal: '#E11D74', acento: '#9D174D', rubor: true },
};

/*
 * Las temporadas que crea el dueño no traen disfraz propio: se elige por la
 * figura que cae de fondo, que es lo que más dice de qué va la fecha, y se
 * pinta con los dos colores que eligió para ella.
 */
const POR_FIGURA = {
  confeti: 'gorro-fiesta',
  estrella: 'gorro-estrella',
  corazon: 'mono',
  copo: 'bufanda',
  hoja: 'bufanda',
  murcielago: 'sombrero-bruja',
  // Sin figuras sigue siendo una fecha especial: algo elegante y discreto.
  ninguna: 'corbatin',
};

// Los colores llegan en hex, a veces en mayúsculas y a veces no.
const mismoColor = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

// Cómo se llama cada uno, para contárselo al dueño en el panel.
export const NOMBRE_DEL_DISFRAZ = {
  'gorro-navidad': 'gorro navideño',
  'sombrero-bruja': 'sombrero de bruja',
  corbatin: 'corbatín',
  mono: 'moño y cachetes colorados',
  'gorro-fiesta': 'gorro de fiesta',
  'gorro-estrella': 'gorro con estrella',
  bufanda: 'bufanda',
};

/*
 * El disfraz de un tema (de fábrica o propio). Null si no le toca ninguno:
 * sin temporada, Tiqui va como siempre.
 */
export const disfrazDeTema = (tema) => {
  if (!tema) return null;
  if (DE_FABRICA[tema.clave] && !tema.propio) return DE_FABRICA[tema.clave];

  const tipo = POR_FIGURA[tema.decoracion?.figura] || 'gorro-fiesta';
  const principal = tema.colores?.['--marca-600'] || '#003049';
  const acento = tema.colores?.['--acento'];
  /*
   * Si el dueño eligió el mismo color para las dos cosas, las rayas del
   * gorro o la bufanda desaparecerían sobre su propio fondo: van en blanco.
   */
  return {
    tipo,
    principal,
    acento: acento && !mismoColor(acento, principal) ? acento : '#FFFFFF',
    rubor: tipo === 'mono',
  };
};

/*
 * El mismo disfraz, pero sin nada en la cabeza: lo de la temporada pasa al
 * cuello.
 *
 * Lo usa la Tiqui que cuelga en el login. Ahí cuelga junto al título, y un
 * sombrero la hace crecer justo hacia arriba y hacia los lados, que es donde
 * está el texto: el gorro de Navidad quedaba detrás de "esquina". La
 * condición para que cuelgue ahí es que no se encime a nada.
 */
const DEL_CUELLO = {
  'gorro-navidad': 'bufanda',
  'sombrero-bruja': 'corbatin',
  mono: 'corbatin',
  'gorro-fiesta': 'corbatin',
  'gorro-estrella': 'corbatin',
};

export const sinSombrero = (disfraz) =>
  disfraz && DEL_CUELLO[disfraz.tipo] ? { ...disfraz, tipo: DEL_CUELLO[disfraz.tipo] } : disfraz;
