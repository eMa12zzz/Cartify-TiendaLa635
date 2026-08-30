/*
 * ============================================================
 * CALCE DE UNA IMAGEN CONTRA EL FORMATO — calceImpresion.js
 * ============================================================
 * Cuando el cliente sube su propio archivo (pestaña "Ya tengo mi archivo",
 * en vez del editor), nadie ajusta esa imagen a la medida que pagó: se manda
 * tal cual a la impresora, a su resolución y proporción originales (ver
 * sendPrintToPrinter.js). Esto no cambia eso — el archivo real sigue
 * viajando intacto — solo calcula si vale la pena avisarle ANTES de mandarlo,
 * para que decida con los ojos abiertos en vez de enterarse hasta que el
 * papel ya salió de la impresora.
 *
 * Solo un aviso, no un bloqueo: forzar el editor para todos le quita a quien
 * ya trae su diseño listo la opción de solo subirlo.
 * ============================================================
 */

// Cuánto se tolera de diferencia de proporción antes de avisar. Una foto
// nunca calza EXACTO con una hoja — 12% deja pasar el ruido normal (un
// celular no mide igual que una hoja Carta) y solo avisa cuando de verdad
// va a sobrar o faltar imagen al recortarla a la fuerza en ese formato.
const TOLERANCIA_PROPORCION = 0.12;

// Por debajo de esta densidad la impresión sale borrosa de cerca. 150 DPI es
// un mínimo razonable para papelería general (no es una imprenta de fotos
// profesional); el editor sí exporta a 300 (ver usePrintComposer.js).
const DPI_MINIMO = 150;
const CM_POR_PULGADA = 2.54;

/*
 * Devuelve el mensaje de aviso (string) si algo no calza, o null si la
 * imagen está lo bastante cerca de la medida elegida.
 */
export const evaluarCalce = ({ anchoPx, altoPx, widthCm, heightCm }) => {
  if (!anchoPx || !altoPx || !widthCm || !heightCm) return null;

  const proporcionImagen = anchoPx / altoPx;
  const proporcionHoja = widthCm / heightCm;
  const diferencia = Math.abs(proporcionImagen - proporcionHoja) / proporcionHoja;

  if (diferencia > TOLERANCIA_PROPORCION) {
    return `La proporción de tu imagen no coincide con la hoja de ${widthCm}×${heightCm} cm — puede salir recortada o con márgenes en blanco al imprimirse.`;
  }

  const anchoMinimo = Math.round((widthCm / CM_POR_PULGADA) * DPI_MINIMO);
  const altoMinimo = Math.round((heightCm / CM_POR_PULGADA) * DPI_MINIMO);

  if (anchoPx < anchoMinimo || altoPx < altoMinimo) {
    return `Tu imagen tiene poca resolución para imprimirse a ${widthCm}×${heightCm} cm — puede salir borrosa o pixelada.`;
  }

  return null;
};
