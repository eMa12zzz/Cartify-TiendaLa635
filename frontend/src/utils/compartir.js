/*
 * ============================================================
 * COMPARTIR UN PRODUCTO — compartir.js
 * ============================================================
 * Cada producto tiene su dirección (/producto/:id). Compartirla es lo que más
 * se hace en El Salvador con una tienda: mandarla por WhatsApp ("¿te traigo
 * esto?"). La vista previa del enlace —foto, nombre y precio— la arma
 * middleware.js en Vercel.
 *
 * En el teléfono se abre el menú de compartir del sistema, que ya trae
 * WhatsApp, Messenger y lo que la persona use. En la computadora ese menú
 * existe a medias y suele estorbar, así que ahí se copia el enlace y se
 * avisa: pegarlo es lo que de todos modos iba a hacer.
 * ============================================================
 */

export const enlaceDeProducto = (producto) =>
  `${window.location.origin}/producto/${producto.id}`;

const esTactil = () => window.matchMedia?.('(pointer: coarse)').matches;

/*
 * Devuelve qué pasó, para que quien llama avise como corresponde:
 *   'compartido' | 'cancelado' | 'copiado' | 'error'
 */
export const compartirEnlace = async ({ titulo, texto, url }) => {
  if (esTactil() && navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto, url });
      return 'compartido';
    } catch (error) {
      // Cerró el menú sin elegir: no es un error, no se avisa nada.
      if (error?.name === 'AbortError') return 'cancelado';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copiado';
  } catch {
    return 'error';
  }
};
