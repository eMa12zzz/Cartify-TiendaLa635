/*
 * ============================================================
 * TEMAS DE TEMPORADA — temporadas.js
 * ============================================================
 * La tienda se pinta de Navidad en diciembre y de Halloween a finales de
 * octubre, sola, sin que nadie se acuerde de entrar a cambiarlo.
 *
 * CÓMO FUNCIONA: cada tema es un puñado de valores para las MISMAS variables
 * de marca que ya usa toda la tienda (--marca-600, --marca-50, --acento...).
 * No hay pantallas duplicadas ni un "modo navideño" con su propio CSS: se
 * repintan cinco variables y el encabezado, las pastillas, los botones y las
 * filas cambian de color juntos, porque todos leen de ahí. Ver index.css.
 *
 * LO QUE NO HACE, a propósito: no cambia tipografías, ni mete copos de nieve
 * cayendo, ni toca las fotos de los productos. Una tienda de barrio en
 * diciembre sigue siendo la misma tienda; lo que se busca es que se sienta la
 * fecha, no disfrazarla. Y las fotos y los precios tienen que leerse igual de
 * bien el 24 de diciembre que el 3 de marzo.
 *
 * LAS FECHAS SON DE EL SALVADOR. La Independencia es el 15 de septiembre, no
 * el 4 de julio: la tienda está en San Salvador y sus clientes son de ahí.
 * ============================================================
 */

/*
 * Los rangos van [desde, hasta] como {mes, dia}, con el mes en base 1 (enero
 * es 1, no 0) porque así es como lo lee una persona. La conversión al mes de
 * JavaScript se hace en un solo lugar, abajo.
 *
 * `colores` son las variables que se repintan. Se listan TODAS en cada tema
 * —aunque alguna repita el valor de siempre— para que se pueda leer un tema
 * completo de un vistazo, sin ir a buscar qué hereda de dónde.
 */
export const TEMAS_DE_TEMPORADA = [
  {
    clave: 'navidad',
    nombre: 'Navidad',
    descripcion: 'Del 1 al 31 de diciembre',
    // Verde pino y rojo. El rojo va de acento y no de primario: en botón
    // grande cansa la vista y se confunde con el rojo de "quedan pocas".
    desde: { mes: 12, dia: 1 },
    hasta: { mes: 12, dia: 31 },
    colores: {
      '--marca-700': '#0F5132',
      '--marca-600': '#166534',
      '--marca-400': '#4CA46B',
      '--marca-100': '#DCEEE1',
      '--marca-50': '#F2FAF4',
      '--acento': '#C1121F',
    },
    muestras: ['#166534', '#C1121F', '#DCEEE1'],
  },
  {
    clave: 'halloween',
    nombre: 'Halloween',
    descripcion: 'Del 24 al 31 de octubre',
    // Naranja calabaza con morado. Es la semana, no el mes entero: un octubre
    // completo de naranja deja de leerse como temporada y pasa a ser el color
    // de la tienda.
    desde: { mes: 10, dia: 24 },
    hasta: { mes: 10, dia: 31 },
    colores: {
      '--marca-700': '#9A3412',
      '--marca-600': '#EA580C',
      '--marca-400': '#FB923C',
      '--marca-100': '#FFEAD5',
      '--marca-50': '#FFF7ED',
      '--acento': '#6D28D9',
    },
    muestras: ['#EA580C', '#6D28D9', '#FFEAD5'],
  },
  {
    clave: 'independencia',
    nombre: 'Independencia',
    descripcion: 'Del 1 al 15 de septiembre',
    // Azul cobalto de la bandera salvadoreña. Las dos semanas de antes, que es
    // cuando se ponen los adornos de verdad en la calle.
    desde: { mes: 9, dia: 1 },
    hasta: { mes: 9, dia: 15 },
    colores: {
      '--marca-700': '#003893',
      '--marca-600': '#0F47AF',
      '--marca-400': '#5B8DE0',
      '--marca-100': '#DEE9FB',
      '--marca-50': '#F4F8FE',
      '--acento': '#0F47AF',
    },
    muestras: ['#0F47AF', '#003893', '#DEE9FB'],
  },
  {
    clave: 'san-valentin',
    nombre: 'San Valentín',
    descripcion: 'Del 7 al 14 de febrero',
    // Rosa y vino. El vino de primario para que el texto blanco encima se lea;
    // el rosa claro solo sirve de fondo.
    desde: { mes: 2, dia: 7 },
    hasta: { mes: 2, dia: 14 },
    colores: {
      '--marca-700': '#831843',
      '--marca-600': '#BE185D',
      '--marca-400': '#EC7FB0',
      '--marca-100': '#FCE7F1',
      '--marca-50': '#FEF5F9',
      '--acento': '#BE185D',
    },
    muestras: ['#BE185D', '#EC7FB0', '#FCE7F1'],
  },
];

export const temaPorClave = (clave) =>
  TEMAS_DE_TEMPORADA.find((t) => t.clave === clave) || null;

/*
 * ¿Cae esta fecha dentro del rango del tema?
 *
 * Se compara por mes y día, sin año, porque los rangos se repiten todos los
 * años. El `mes - 1` de aquí es la única traducción al mes de JavaScript en
 * todo el archivo.
 *
 * Ojo con los rangos que cruzan diciembre-enero: hoy ninguno lo hace, pero si
 * algún día se agrega uno (una temporada de fin de año que vaya del 20 de
 * diciembre al 6 de enero), esta comparación da falso todo el rango. Habría
 * que partirlo en dos temas o comparar al revés cuando `desde > hasta`.
 */
const caeEnRango = (fecha, tema) => {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const comoNumero = mes * 100 + dia;
  const inicio = tema.desde.mes * 100 + tema.desde.dia;
  const fin = tema.hasta.mes * 100 + tema.hasta.dia;
  return comoNumero >= inicio && comoNumero <= fin;
};

export const temaDeLaFecha = (fecha = new Date()) =>
  TEMAS_DE_TEMPORADA.find((tema) => caeEnRango(fecha, tema)) || null;

/*
 * Qué tema toca AHORA, según lo que diga la configuración.
 *
 *   'automatico' → lo decide el calendario.
 *   'manual'     → manda el que eligieron, pase lo que pase en el calendario.
 *                  Sirve para adelantarse (poner Navidad el 20 de noviembre
 *                  porque ya llegó el producto navideño) y para probarlo en
 *                  el panel sin esperar a diciembre.
 *   'ninguno'    → los colores de siempre, todo el año.
 *
 * Devuelve el tema completo o null. Null es un resultado normal y esperado —
 * la mayor parte del año no hay temporada— y significa "no toques nada".
 */
export const temaActivo = (temporada, fecha = new Date()) => {
  const modo = temporada?.modo || 'automatico';
  if (modo === 'ninguno') return null;
  if (modo === 'manual') return temaPorClave(temporada?.tema);
  return temaDeLaFecha(fecha);
};

/*
 * Pintar (o despintar) el tema sobre el documento.
 *
 * Se escriben las variables en el <html> con setProperty, que pisa lo que
 * declara index.css sin tener que duplicar una hoja de estilos por temporada.
 * Al quitar el tema se BORRAN las propiedades en vez de reescribir los valores
 * originales: así el archivo de tokens sigue siendo la única fuente de verdad
 * de cómo se ve la tienda en un día normal, y cambiar el café de la marca allá
 * no obliga a acordarse de venir a cambiarlo aquí también.
 */
const VARIABLES = ['--marca-700', '--marca-600', '--marca-400', '--marca-100', '--marca-50', '--acento'];

export const aplicarTema = (tema) => {
  const raiz = document.documentElement;

  if (!tema) {
    VARIABLES.forEach((v) => raiz.style.removeProperty(v));
    raiz.removeAttribute('data-temporada');
    return;
  }

  Object.entries(tema.colores).forEach(([variable, valor]) => {
    raiz.style.setProperty(variable, valor);
  });
  // Por si alguna pantalla quiere reaccionar a la temporada con CSS puro.
  raiz.setAttribute('data-temporada', tema.clave);
};
