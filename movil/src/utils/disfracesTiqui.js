/*
 * ============================================================
 * DISFRACES DE TIQUI — qué lleva puesto según la temporada
 * ============================================================
 * Copia de frontend/src/utils/disfracesTiqui.js con los nombres de la paleta
 * de aquí (`colores.marca` en vez de `--marca-600`). Tiqui tiene que vestirse
 * igual en el teléfono y en la computadora: si allá cambia, se cambia aquí.
 *
 * Las temporadas de fábrica traen su disfraz; las que crea el dueño lo
 * sacan de la figura que eligió para la decoración.
 * ============================================================
 */

const DE_FABRICA = {
  navidad: { tipo: 'gorro-navidad', principal: '#C1121F', acento: '#FFFFFF' },
  halloween: { tipo: 'sombrero-bruja', principal: '#4C1D95', acento: '#EA580C' },
  // Los colores de la bandera: las alas azules y el nudo blanco en medio.
  independencia: { tipo: 'corbatin', principal: '#0F47AF', acento: '#FFFFFF' },
  // `rubor`: además del moño, anda con los cachetes colorados.
  'san-valentin': { tipo: 'mono', principal: '#E11D74', acento: '#9D174D', rubor: true },
};

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

const mismoColor = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

export const disfrazDeTema = (tema) => {
  if (!tema) return null;
  if (DE_FABRICA[tema.clave] && !tema.propio) return DE_FABRICA[tema.clave];

  const tipo = POR_FIGURA[tema.decoracion?.figura] || 'gorro-fiesta';
  const principal = tema.colores?.marca || '#003049';
  const acento = tema.colores?.acento;
  // Mismo color para las dos cosas: las rayas desaparecerían, van en blanco.
  return {
    tipo,
    principal,
    acento: acento && !mismoColor(acento, principal) ? acento : '#FFFFFF',
    rubor: tipo === 'mono',
  };
};

/*
 * El mismo disfraz, sin nada en la cabeza: lo de la temporada pasa al cuello.
 * Para cuando Tiqui cuelga pegada a algo de arriba y un sombrero se encimaría.
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
