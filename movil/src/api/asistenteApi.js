/*
 * ============================================================
 * ASISTENTE — el plan B con IA
 * ============================================================
 * A diferencia del resto de la app, esto NO es un calco de
 * `frontend/src/api/aiService.js`: la web sigue en `/ai/entender` (un
 * producto por turno, `responseSchema`), pero móvil habla con
 * `/ai/entender-herramientas` — el mismo plan B, con tool calling de Gemini
 * del lado del backend, para poder entender "dos manzanas y una leche" en
 * un solo viaje en vez de solo la mitad. Ver el comentario grande en
 * `backend/src/controller/aiController.js` (entenderConHerramientas).
 *
 * Se llama SOLO cuando las reglas locales del asistente no entendieron la
 * frase (ver useAsistenteVoz.js).
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
      return await peticion('/ai/entender-herramientas', {
        metodo: 'POST',
        cuerpo: { frase, productos, carrito },
      });
    } catch {
      return { acciones: [], respuesta: '', entendido: false, origen: 'sin-red' };
    }
  },
};

export default asistenteApi;
