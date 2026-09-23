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
  /*
   * El catálogo lo arma el servidor con lo que tiene existencias (ver
   * aiController, EL CATÁLOGO QUE VE EL ASISTENTE); `productos` solo sigue
   * viajando para un backend viejo que todavía lo use. Lo nuevo es
   * `historial`, lo último que se dijo, para entender un "sí" o un "mejor dos".
   */
  entenderPedido: async ({ frase, productos, carrito, historial }) => {
    try {
      return await peticion('/ai/entender-herramientas', {
        metodo: 'POST',
        cuerpo: { frase, productos, carrito, historial },
        tiempoMaximo: 15000,
      });
    } catch {
      return { acciones: [], respuesta: '', entendido: false, origen: 'sin-red' };
    }
  },

  /*
   * Despierta el servidor al abrir el asistente: Render lo duerme si no hay
   * tráfico, y la primera pregunta tardaba medio minuto. No gasta IA y no
   * importa si falla.
   */
  despertar: () => {
    peticion('/ai/listo').catch(() => {});
  },
};

export default asistenteApi;
