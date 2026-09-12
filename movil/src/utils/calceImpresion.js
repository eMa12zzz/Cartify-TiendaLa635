/*
 * ============================================================
 * CALCE DE UNA IMAGEN CONTRA EL FORMATO — calceImpresion.js
 * ============================================================
 * Puerto verbatim de `frontend/src/utils/calceImpresion.js`. Cuando el
 * cliente sube su propia foto, nadie la ajusta a la medida elegida: se manda
 * tal cual, a su resolución y proporción originales. Esto solo avisa ANTES
 * de mandarla si vale la pena — no bloquea el envío.
 *
 * Más simple que en la web: `expo-image-picker` ya entrega el ancho y el
 * alto de la imagen elegida en el mismo resultado, así que no hace falta
 * cargarla aparte para medirla (allá sí, con un <img> y una promesa).
 * ============================================================
 */

// Cuánto se tolera de diferencia de proporción antes de avisar. Una foto
// nunca calza EXACTO con una hoja — 12% deja pasar el ruido normal.
const TOLERANCIA_PROPORCION = 0.12;

// Por debajo de esta densidad la impresión sale borrosa de cerca.
const DPI_MINIMO = 150;
const CM_POR_PULGADA = 2.54;

/*
 * Devuelve el mensaje de aviso (string) si algo no calza, o '' si la imagen
 * está lo bastante cerca de la medida elegida.
 */
export const evaluarCalce = ({ anchoPx, altoPx, widthCm, heightCm }) => {
  if (!anchoPx || !altoPx || !widthCm || !heightCm) return '';

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

  return '';
};
