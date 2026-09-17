/*
 * ============================================================
 * TEMPORADAS — temporadas.js
 * ============================================================
 * Pinta la tienda del color de la fecha. Copia de
 * `frontend/src/utils/temporadas.js`, con una traducción obligada.
 *
 * ── De variables CSS a nombres de paleta ──
 *
 * En la web los colores son variables CSS (`--marca-600`) y el tema se aplica
 * escribiéndolas en el <html>: una sola línea repinta la tienda entera porque
 * todo el CSS ya las está leyendo. Aquí no hay nada parecido — los estilos de
 * React Native son objetos y `StyleSheet.create` se evalúa UNA vez, al importar
 * el módulo, así que un color escrito ahí ya no se puede cambiar después.
 *
 * Por eso los temas traen los mismos colores con los nombres de la paleta del
 * proyecto, y quien los reparte es TemaContext. La equivalencia es directa:
 *
 *   --marca-700 → marcaOscuro    --marca-100 → marcaSuave
 *   --marca-600 → marca          --marca-50  → marcaTenue
 *   --marca-400 → marcaClaro     --acento    → acento
 *
 * ── El acento no es el primario ──
 *
 * Vale la pena repetir lo que dice el original sobre Navidad: el rojo va de
 * ACENTO y no de primario. En botón grande cansa la vista, y además se
 * confunde con el rojo de "quedan pocas", que es un aviso y no un adorno.
 * ============================================================
 */

export const TEMAS_DE_TEMPORADA = [
  {
    clave: 'navidad',
    nombre: 'Navidad',
    descripcion: 'Del 1 al 31 de diciembre',
    desde: { mes: 12, dia: 1 },
    hasta: { mes: 12, dia: 31 },
    colores: {
      marcaOscuro: '#0F5132',
      marca: '#166534',
      marcaClaro: '#4CA46B',
      marcaSuave: '#DCEEE1',
      marcaTenue: '#F2FAF4',
      acento: '#C1121F',
    },
    decoracion: {
      saludo: 'Felices fiestas — pida con tiempo, que diciembre se llena',
      figura: 'copo',
      /*
       * Cuántas figuras caen a la vez. Pocas a propósito: veinte copos ya no
       * son "está nevando", son un protector de pantalla encima de la tienda.
       */
      cantidad: 14,
      // Cae recto y despacio, como la nieve de verdad.
      caida: 'lenta',
    },
  },
  {
    clave: 'halloween',
    nombre: 'Halloween',
    descripcion: 'Del 24 al 31 de octubre',
    // Es la semana, no el mes entero: un octubre completo de naranja deja de
    // leerse como temporada y pasa a ser el color de la tienda.
    desde: { mes: 10, dia: 24 },
    hasta: { mes: 10, dia: 31 },
    colores: {
      marcaOscuro: '#9A3412',
      marca: '#EA580C',
      marcaClaro: '#FB923C',
      marcaSuave: '#FFEAD5',
      marcaTenue: '#FFF7ED',
      acento: '#6D28D9',
    },
    decoracion: {
      saludo: 'Noche de brujas — dulces y disfraces en la tienda',
      figura: 'murcielago',
      cantidad: 10,
      // Se mece de lado mientras baja: un murciélago que cae recto parece una
      // piedra.
      caida: 'meciendo',
    },
  },
  {
    clave: 'independencia',
    nombre: 'Independencia',
    descripcion: 'Del 1 al 15 de septiembre',
    // Azul cobalto de la bandera. Las dos semanas de antes, que es cuando se
    // ponen los adornos de verdad en la calle.
    desde: { mes: 9, dia: 1 },
    hasta: { mes: 9, dia: 15 },
    colores: {
      marcaOscuro: '#003893',
      marca: '#0F47AF',
      marcaClaro: '#5B8DE0',
      marcaSuave: '#DEE9FB',
      marcaTenue: '#F4F8FE',
      acento: '#0F47AF',
    },
    decoracion: {
      saludo: 'Fiestas patrias — ¡viva El Salvador!',
      figura: 'confeti',
      cantidad: 16,
      caida: 'meciendo',
    },
  },
  {
    clave: 'san-valentin',
    nombre: 'San Valentín',
    descripcion: 'Del 7 al 14 de febrero',
    // El vino de primario para que el texto blanco encima se lea; el rosa
    // claro solo sirve de fondo.
    desde: { mes: 2, dia: 7 },
    hasta: { mes: 2, dia: 14 },
    colores: {
      marcaOscuro: '#831843',
      marca: '#BE185D',
      marcaClaro: '#EC7FB0',
      marcaSuave: '#FCE7F1',
      marcaTenue: '#FEF5F9',
      acento: '#BE185D',
    },
    decoracion: {
      saludo: 'Día del cariño — llévele algo a quien quiere',
      figura: 'corazon',
      cantidad: 12,
      caida: 'meciendo',
    },
  },
];

/*
 * TEMPORADAS PROPIAS — las que crea el dueño desde el panel web
 * ("Regreso a clases", "Día de la madre"...). Del panel llegan solo dos
 * colores; los tonos claros y oscuros se derivan aquí mezclando el principal
 * con blanco o negro, igual que en frontend/src/utils/temporadas.js.
 */
const hexARgb = (hex) => {
  const limpio = String(hex || '').replace('#', '');
  const n = parseInt(limpio.length === 6 ? limpio : '003049', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbAHex = (rgb) =>
  `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

const mezclar = (hex, con, cuanto) => {
  const a = hexARgb(hex);
  const b = hexARgb(con);
  return rgbAHex(a.map((c, i) => c + (b[i] - c) * cuanto));
};

const temaDesdePropio = (propio) => ({
  clave: propio.clave,
  nombre: propio.nombre,
  propio: true,
  desde: propio.desde,
  hasta: propio.hasta,
  colores: {
    marcaOscuro: mezclar(propio.colorPrincipal, '#000000', 0.22),
    marca: rgbAHex(hexARgb(propio.colorPrincipal)),
    marcaClaro: mezclar(propio.colorPrincipal, '#FFFFFF', 0.35),
    marcaSuave: mezclar(propio.colorPrincipal, '#FFFFFF', 0.86),
    marcaTenue: mezclar(propio.colorPrincipal, '#FFFFFF', 0.95),
    acento: rgbAHex(hexARgb(propio.colorAcento)),
  },
  decoracion: {
    saludo: (propio.saludo || '').trim(),
    figura: propio.figura || 'confeti',
    cantidad: propio.figura === 'ninguna' ? 0 : 12,
    caida: propio.figura === 'copo' ? 'lenta' : 'meciendo',
  },
});

// Las propias primero: si comparten fechas con una de fábrica, gana la propia.
export const todosLosTemas = (temporada) => [
  ...(Array.isArray(temporada?.personalizados) ? temporada.personalizados : []).map(temaDesdePropio),
  ...TEMAS_DE_TEMPORADA,
];

export const temaPorClave = (clave, lista = TEMAS_DE_TEMPORADA) =>
  lista.find((t) => t.clave === clave) || null;

/*
 * ¿Cae esta fecha dentro del rango del tema?
 *
 * Se compara por mes y día, sin año, porque los rangos se repiten todos los
 * años. El `mes - 1` de JavaScript se corrige aquí y en ningún otro lado.
 *
 * Un rango que cruza el año (del 20 de diciembre al 6 de enero) tiene el
 * inicio DESPUÉS del fin: ahí cae dentro lo que esté pasado el inicio o antes
 * del fin. Las de fábrica no cruzan el año, pero una propia sí puede.
 */
const caeEnRango = (fecha, tema) => {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const comoNumero = mes * 100 + dia;
  const inicio = tema.desde.mes * 100 + tema.desde.dia;
  const fin = tema.hasta.mes * 100 + tema.hasta.dia;
  if (inicio <= fin) return comoNumero >= inicio && comoNumero <= fin;
  return comoNumero >= inicio || comoNumero <= fin;
};

export const temaDeLaFecha = (fecha = new Date(), lista = TEMAS_DE_TEMPORADA) =>
  lista.find((tema) => caeEnRango(fecha, tema)) || null;

/*
 * Qué tema toca AHORA, según lo que diga la configuración de la tienda.
 *
 *   'automatico' → lo decide el calendario.
 *   'manual'     → manda el que eligieron, pase lo que pase en el calendario.
 *                  Sirve para adelantarse (poner Navidad el 20 de noviembre
 *                  porque ya llegó el producto navideño).
 *   'ninguno'    → los colores de siempre, todo el año.
 *
 * Devuelve el tema completo o null. Null es un resultado normal y esperado —la
 * mayor parte del año no hay temporada— y significa "no toques nada".
 */
export const temaActivo = (temporada, fecha = new Date()) => {
  const modo = temporada?.modo || 'automatico';
  if (modo === 'ninguno') return null;
  const lista = todosLosTemas(temporada);
  if (modo === 'manual') return temaPorClave(temporada?.tema, lista);
  return temaDeLaFecha(fecha, lista);
};
