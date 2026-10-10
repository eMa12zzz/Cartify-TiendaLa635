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
 * UN DISFRAZ es una pieza por lugar, cada una con sus dos colores, y los
 * cachetes colorados prendidos o no:
 *
 *   { cabeza: { tipo: 'corona', principal: '#FFC23D', acento: '#E11D48' },
 *     cara: null,
 *     cuello: { tipo: 'corbatin', principal: '#0F47AF', acento: '#FFFFFF' },
 *     rubor: false }
 *
 * De dónde sale el de cada temporada:
 *   1. El que armó el dueño en el panel, si armó uno (temporada.disfraces,
 *      por la clave de la temporada). Armado sin ninguna pieza quiere decir
 *      "esta temporada Tiqui va sin disfraz".
 *   2. Si no armó ninguno, el de fábrica: las temporadas de fábrica traen el
 *      suyo pensado a mano y las propias lo sacan de la figura que cae de
 *      fondo, pintado con sus dos colores.
 *
 * Aquí solo se decide QUÉ lleva. Las piezas están en piezasDisfraz.js y cada
 * plataforma las dibuja con su componente.
 *
 * ESTE ARCHIVO ESTÁ COPIADO TAL CUAL en movil/src/utils/disfracesTiqui.js
 * (una prueba de la app avisa si dejan de ser iguales).
 * ============================================================
 */

import { PIEZAS_DISFRAZ, RANURAS_DISFRAZ } from './piezasDisfraz';

const ES_HEX = /^#[0-9a-fA-F]{6}$/;
const hexO = (valor, otro) => (ES_HEX.test(valor || '') ? valor.toUpperCase() : otro);

// Una pieza con sus colores; los que falten, los de la pieza.
export const piezaCon = (tipo, principal, acento) => {
  const pieza = PIEZAS_DISFRAZ[tipo];
  if (!pieza) return null;
  const [p, a = p] = pieza.colores;
  return { tipo, principal: hexO(principal, p), acento: hexO(acento, a) };
};

/*
 * Deja un disfraz limpio: solo piezas que existen, cada una en su lugar y con
 * colores válidos. También entiende la forma de antes —una sola pieza,
 * { tipo, principal, acento, rubor }— por si llega alguno guardado así.
 */
export const normalizarDisfraz = (entrada) => {
  if (!entrada || typeof entrada !== 'object') return null;
  if (typeof entrada.tipo === 'string') {
    const pieza = PIEZAS_DISFRAZ[entrada.tipo];
    return pieza ? normalizarDisfraz({ [pieza.ranura]: entrada, rubor: entrada.rubor }) : null;
  }
  const limpio = { rubor: entrada.rubor === true };
  for (const { clave } of RANURAS_DISFRAZ) {
    const pieza = entrada[clave];
    const existe = pieza && PIEZAS_DISFRAZ[pieza.tipo]?.ranura === clave;
    limpio[clave] = existe ? piezaCon(pieza.tipo, pieza.principal, pieza.acento) : null;
  }
  return limpio;
};

export const disfrazVacio = () => ({ cabeza: null, cara: null, cuello: null, rubor: false });

// Sin ninguna pieza ni cachetes: Tiqui va como siempre.
export const estaVacio = (disfraz) =>
  !disfraz || (!disfraz.rubor && RANURAS_DISFRAZ.every(({ clave }) => !disfraz[clave]));

const DE_FABRICA = {
  navidad: { cabeza: piezaCon('gorro-navidad', '#C1121F', '#FFFFFF') },
  halloween: { cabeza: piezaCon('sombrero-bruja', '#4C1D95', '#EA580C') },
  // Los colores de la bandera: las alas azules y el nudo blanco en medio.
  independencia: { cuello: piezaCon('corbatin', '#0F47AF', '#FFFFFF') },
  // Además del moño, anda con los cachetes colorados.
  'san-valentin': { cabeza: piezaCon('mono', '#E11D74', '#9D174D'), rubor: true },
};

/*
 * Las temporadas que crea el dueño, si no les armó disfraz: se elige por la
 * figura que cae de fondo, que es lo que más dice de qué va la fecha.
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

// La web nombra los colores como variables CSS y la app con su paleta.
const principalDe = (tema) => tema.colores?.['--marca-600'] || tema.colores?.marca || '#003049';
const acentoDe = (tema) => tema.colores?.['--acento'] || tema.colores?.acento;

// El disfraz que trae la temporada si el dueño no armó otro.
export const disfrazDeFabrica = (tema) => {
  if (!tema) return null;
  if (DE_FABRICA[tema.clave] && !tema.propio) return normalizarDisfraz(DE_FABRICA[tema.clave]);

  const tipo = POR_FIGURA[tema.decoracion?.figura] || 'gorro-fiesta';
  const principal = principalDe(tema);
  const acento = acentoDe(tema);
  /*
   * Si el dueño eligió el mismo color para las dos cosas, las rayas del
   * gorro o la bufanda desaparecerían sobre su propio fondo: van en blanco.
   */
  const distinto = acento && String(acento).toLowerCase() !== String(principal).toLowerCase();
  return normalizarDisfraz({
    [PIEZAS_DISFRAZ[tipo].ranura]: { tipo, principal, acento: distinto ? acento : '#FFFFFF' },
    rubor: tipo === 'mono',
  });
};

/*
 * El disfraz de un tema (de fábrica o propio), con lo que haya armado el
 * dueño. Null si no le toca ninguno: sin temporada, Tiqui va como siempre.
 */
export const disfrazDeTema = (tema, disfraces) => {
  if (!tema) return null;
  const armado = disfraces?.[tema.clave];
  const disfraz = armado ? normalizarDisfraz(armado) : disfrazDeFabrica(tema);
  return estaVacio(disfraz) ? null : disfraz;
};

/*
 * El mismo disfraz, pero sin nada en la cabeza: lo de la cabeza pasa al
 * cuello, si el cuello está libre.
 *
 * Lo usa la Tiqui que cuelga en el login. Ahí cuelga junto al título, y un
 * sombrero la hace crecer justo hacia arriba y hacia los lados, que es donde
 * está el texto: el gorro de Navidad quedaba detrás de "esquina". La
 * condición para que cuelgue ahí es que no se encime a nada.
 */
const DEL_CUELLO = { 'gorro-navidad': 'bufanda', flor: 'collar-flores' };

export const sinSombrero = (disfraz) => {
  if (!disfraz?.cabeza) return disfraz;
  const { cabeza } = disfraz;
  const cuello = disfraz.cuello || piezaCon(DEL_CUELLO[cabeza.tipo] || 'corbatin', cabeza.principal, cabeza.acento);
  return { ...disfraz, cabeza: null, cuello };
};

/*
 * Cómo se lo cuenta el panel al dueño: "corona, lentes de sol y corbatín",
 * "moño y cachetes colorados".
 */
export const describirDisfraz = (disfraz) => {
  if (estaVacio(disfraz)) return '';
  const partes = RANURAS_DISFRAZ
    .map(({ clave }) => disfraz[clave] && PIEZAS_DISFRAZ[disfraz[clave].tipo].nombre.toLowerCase())
    .filter(Boolean);
  if (disfraz.rubor) partes.push('cachetes colorados');
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
};

// ¿Son el mismo disfraz? Para saber si hay cambios sin guardar.
export const mismoDisfraz = (a, b) => {
  const x = normalizarDisfraz(a) || disfrazVacio();
  const y = normalizarDisfraz(b) || disfrazVacio();
  return x.rubor === y.rubor && RANURAS_DISFRAZ.every(({ clave }) => {
    const p = x[clave];
    const q = y[clave];
    if (!p || !q) return !p && !q;
    return p.tipo === q.tipo && p.principal === q.principal && p.acento === q.acento;
  });
};
