/*
 * ============================================================
 * COLORES — la misma paleta que la tienda web, en claro y en oscuro
 * ============================================================
 * En la web estos valores viven repetidos arriba de cada pantalla
 * (`const BROWN = '#B46C30'`). Aquí se juntan en un solo lugar porque la app
 * móvil arranca de cero y no tiene sentido heredar esa repetición.
 *
 * Si un día la tienda cambia de color, este archivo es el que se toca.
 *
 * ── Dos paletas con los MISMOS nombres ──
 *
 * El modo oscuro (Mi cuenta → Preferencias, ver ModoContext) no pregunta en
 * cada pantalla "¿y aquí qué color va?": cambia la paleta entera y las
 * pantallas se repintan solas. Es lo mismo que hace la web con
 * `:root[data-modo="oscuro"]` en frontend/src/index.css — mismos nombres,
 * otros valores.
 *
 * Por eso ninguna pantalla importa estas paletas directo: piden la del modo
 * que rige con `useColores()` (para un color suelto, como el de un icono) o
 * arman sus estilos con `useEstilos(crearEstilos)` (ver ModoContext). Un
 * `#FFFFFF` fijo en una pantalla es un pedazo que se queda blanco en oscuro.
 *
 * Los valores oscuros son los de la web. Los claros de siempre no se movieron:
 * encender el modo oscuro no tenía que cambiarle nada a quien se queda en
 * claro.
 * ============================================================
 */

export const COLORES_CLARO = {
  oscuro: false,

  // El azul marino de la marca y su versión oscura (--marca-600/--marca-700
  // de la web). Antes era café; la tienda se repintó de azul y esto se había
  // quedado atrás.
  marca: '#003049',
  marcaOscuro: '#00283D',
  // El azul apagado del botón deshabilitado: se ve apretable pero no lo está.
  marcaApagado: '#A9C2CE',
  // Fondo tenue para los cuadritos de iconos de las ventajas (--marca-100).
  marcaSuave: '#DDECF3',

  fondo: '#FFFFFF',
  texto: '#000000',
  tituloFuerte: '#1D1206',
  tituloVentaja: '#2A1A0E',
  textoSuave: '#7A7269',
  textoVentaja: '#55504A',
  textoTenue: '#888888',
  subtitulo: '#9A938C',

  linea: '#E8E8E8',
  lineaCard: '#F0E7DE',
  borde: '#E0E0E0',
  iconoCampo: '#AAAAAA',
  marcador: '#BBBBBB',

  error: '#FF4D4F',

  /*
   * ── Los tokens de la web ──
   * Los que ya existían arriba cubren el texto y las líneas; estos son los que
   * hicieron falta al pasar las pantallas a oscuro, con el nombre y el valor
   * claro de frontend/src/index.css.
   */
  // Texto principal y los botones negros ("Agregar", "Pagar").
  tinta: '#1C1614',
  tintaSuave: '#6B6560',
  tintaTenue: '#9C9691',
  // Iconos en reposo que apenas se ven (el corazón vacío).
  tintaApagada: '#D4D0CC',
  // El texto encima de un botón color tinta: blanco en claro, oscuro en oscuro.
  sobreTinta: '#FFFFFF',

  // Lo que flota encima: hojas de detalle, modales, la barra de abajo.
  papelAlto: '#FFFFFF',
  // Filas presionadas, fondos apenas distintos del de la página.
  papelSuave: '#FAFAFA',
  // Fondo de la foto de producto, campos, pastillas.
  papelGris: '#F5F5F5',
  banda: '#E9E7E4',
  // Un cartelito encima de una foto o de un mapa: casi opaco, que se lea.
  papelVelado: 'rgba(255, 255, 255, 0.94)',
  // Lo que oscurece detrás de una hoja o un modal.
  velo: 'rgba(0, 0, 0, 0.45)',
  // Sombreado al presionar algo que no es un botón de color.
  realce: 'rgba(0, 0, 0, 0.03)',

  alerta: '#D8542C',
  alertaTexto: '#8A2B12',
  exito: '#2F8F4E',

  /*
   * Colores de ESTADO: verde de listo, azul de en camino, ámbar de cuidado,
   * rojo de error. No son marca, así que no cambian con la temporada; sí
   * cambian con el modo oscuro, porque un fondo pastel sobre negro deslumbra.
   */
  exitoFondo: '#EFFAF1',
  exitoBorde: '#D3EEDA',
  exitoTexto: '#14663A',
  exitoSuave: '#3C7A55',
  exitoVivo: '#16A34A',
  infoFondo: '#EFF5FF',
  infoBorde: '#CFE0FF',
  infoTexto: '#173F94',
  infoSuave: '#3E5FA3',
  infoVivo: '#1D4ED8',
  avisoFondo: '#FFF6E9',
  avisoBorde: '#F3DFC0',
  avisoTexto: '#7A3E08',
  avisoVivo: '#B4590C',
  peligroFondo: '#FEF2F2',
  peligroBorde: '#FECACA',
  peligro: '#DC2626',
};

/*
 * El oscuro de la web (`:root[data-modo="oscuro"]` en index.css). La marca
 * oscura sale de `paletaOscura()` en utils/temporadas.js a partir del azul de
 * la casa: el #003049 es casi negro y sobre el fondo oscuro los botones
 * desaparecían, así que sube hasta donde el texto blanco del botón se sigue
 * leyendo. El "presionado" (marcaOscuro) pasa a ser MÁS claro: en oscuro lo
 * que se ilumina es lo que responde.
 */
export const COLORES_OSCURO = {
  oscuro: true,

  marca: '#0F80BA',
  marcaOscuro: '#1296DA',
  marcaApagado: '#2E3A42',
  marcaSuave: '#113041',

  fondo: '#121417',
  texto: '#ECEEF0',
  tituloFuerte: '#ECEEF0',
  tituloVentaja: '#E3E6E9',
  textoSuave: '#A9B0B7',
  textoVentaja: '#BCC2C8',
  textoTenue: '#7D858D',
  subtitulo: '#8A9299',

  linea: '#2A2F35',
  lineaCard: '#2A2F35',
  borde: '#3A4047',
  iconoCampo: '#7D858D',
  marcador: '#6B737B',

  error: '#F87171',

  tinta: '#ECEEF0',
  tintaSuave: '#A9B0B7',
  tintaTenue: '#7D858D',
  tintaApagada: '#4A5058',
  sobreTinta: '#121417',

  papelAlto: '#1A1D21',
  papelSuave: '#181B1F',
  papelGris: '#1F2328',
  banda: '#23272C',
  papelVelado: 'rgba(26, 29, 33, 0.94)',
  velo: 'rgba(0, 0, 0, 0.65)',
  realce: 'rgba(255, 255, 255, 0.05)',

  alerta: '#F07A52',
  alertaTexto: '#F4A58A',
  exito: '#4CC27A',

  exitoFondo: '#10261A',
  exitoBorde: '#1E4630',
  exitoTexto: '#7DDBA3',
  exitoSuave: '#5FB386',
  exitoVivo: '#34C46A',
  infoFondo: '#121F36',
  infoBorde: '#22385F',
  infoTexto: '#A3C2FF',
  infoSuave: '#8AA5D8',
  infoVivo: '#6A9CFF',
  avisoFondo: '#2A1F12',
  avisoBorde: '#4F3A1C',
  avisoTexto: '#F2C58B',
  avisoVivo: '#F0A35A',
  peligroFondo: '#331719',
  peligroBorde: '#5C2629',
  peligro: '#F87171',
};

/*
 * La paleta clara con su nombre de siempre, para lo que se pinta fuera de una
 * pantalla (el HTML de un mapa, un valor por defecto) y no puede usar hooks.
 * Dentro de un componente, `useColores()`.
 */
export const COLORES = COLORES_CLARO;

export default COLORES;
