/*
 * ============================================================
 * ASISTENTE — el plan B con IA
 * ============================================================
 * El equivalente móvil de `frontend/src/api/aiService.js` (solo la parte de
 * `entenderPedido`): mismo endpoint (`/ai/entender`), que ya existe en el
 * backend y no hubo que tocar. Se llama SOLO cuando las reglas locales del
 * asistente no entendieron la frase.
 * ============================================================
 */

import { peticion } from './api';

export const asistenteApi = {
  /*
   * Nunca lanza error: sin internet o sin IA configurada, el asistente sigue
   * como siempre, pidiendo que le repitan.
   */
  entenderPedido: async ({ frase, productos, carrito }) => {
    try {
      return await peticion('/ai/entender', {
        metodo: 'POST',
        cuerpo: { frase, productos, carrito },
      });
    } catch {
      return { accion: 'ninguna', entendido: false, origen: 'sin-red' };
    }
  },
};

export default asistenteApi;
