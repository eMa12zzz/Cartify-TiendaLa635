/*
 * ============================================================
 * COLORES — la misma paleta que la tienda web
 * ============================================================
 * En la web estos valores viven repetidos arriba de cada pantalla
 * (`const BROWN = '#B46C30'`). Aquí se juntan en un solo lugar porque la app
 * móvil arranca de cero y no tiene sentido heredar esa repetición.
 *
 * Si un día la tienda cambia de color, este archivo es el que se toca.
 * ============================================================
 */

export const COLORES = {
  // El café de la marca y su versión oscura (el :hover de la web).
  marca: '#B46C30',
  marcaOscuro: '#8A5222',
  // El café apagado del botón deshabilitado: se ve apretable pero no lo está.
  marcaApagado: '#D8C5AF',
  // Fondo tenue para los cuadritos de iconos de las ventajas.
  marcaSuave: '#FAF3EB',

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
};

export default COLORES;
