import api from './api';

/*
 * SERVICIO DE IA — aiService.js
 * Por ahora solo redacta promociones; aquí irá lo demás que le pidamos a Claude.
 */
export const aiService = {
  generarCopyPromo: async (payload) => {
    const response = await api.post('/ai/promo-copy', payload);
    return response.data;
  },

  /*
   * Descifra lo que pidió el cliente por voz. Se llama SOLO cuando las reglas
   * del asistente no entendieron: el caso común ("quiero dos manzanas") se
   * resuelve al instante sin salir a internet.
   *
   * Nunca lanza error: si la IA no está disponible devuelve entendido:false y
   * el asistente sigue como siempre, pidiendo que le repitan.
   */
  entenderPedido: async ({ frase, productos, carrito }) => {
    try {
      // enSilencio: si la IA no contesta, el asistente pide que le repitan y
      // ya. Ni aviso rojo ni sesión cerrada. Ver api.js.
      const response = await api.post('/ai/entender', { frase, productos, carrito }, { enSilencio: true });
      return response.data;
    } catch {
      return { accion: 'ninguna', entendido: false, origen: 'sin-red' };
    }
  },
};
