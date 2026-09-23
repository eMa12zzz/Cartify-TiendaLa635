import api from './api';

/*
 * SERVICIO DE IA — aiService.js
 * Redacta promociones y atiende a Tiqui, el asistente de voz.
 */
export const aiService = {
  generarCopyPromo: async (payload) => {
    const response = await api.post('/ai/promo-copy', payload);
    return response.data;
  },

  /*
   * Tiqui: descifra lo que dijo el cliente y devuelve qué hacer (acciones) y
   * qué decir. Se llama cuando las reglas rápidas del asistente no alcanzan
   * ("quiero dos manzanas" se resuelve al instante sin salir a internet).
   *
   * El catálogo, las promociones y los datos de la tienda los pone el
   * servidor; aquí solo viaja lo que sabe el navegador: el carrito y lo
   * último que se habló (para entender un "sí" o un "mejor dos").
   *
   * Nunca lanza error: sin red devuelve origen 'sin-red' y el asistente lo
   * dice tal cual.
   */
  asistente: async ({ frase, carrito, historial }) => {
    try {
      // enSilencio: si la IA no contesta, ni aviso rojo ni sesión cerrada
      // (ver api.js). Y con tope: alguien está esperando parado.
      const response = await api.post('/ai/asistente', { frase, carrito, historial }, { enSilencio: true, timeout: 15000 });
      return response.data;
    } catch {
      return { acciones: [], respuesta: '', entendido: false, origen: 'sin-red' };
    }
  },

  /*
   * Despierta el servidor apenas se abre el asistente (Render lo duerme si no
   * hay tráfico) y pregunta si hay voz de Tiqui. Nunca falla: sin respuesta,
   * `voz` es false y se habla con la voz del sistema.
   */
  despertar: async () => {
    try {
      const response = await api.get('/ai/listo', { enSilencio: true, timeout: 45000 });
      return { voz: Boolean(response.data?.voz) };
    } catch {
      return { voz: false };
    }
  },

  // Dónde está el audio de una frase dicha por Tiqui (ver backend utils/vozTiqui.js).
  urlVoz: (texto) => `${api.defaults.baseURL}/ai/voz?t=${encodeURIComponent(texto)}`,
};
