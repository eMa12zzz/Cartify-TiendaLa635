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
  /*
   * El catálogo lo arma el servidor con lo que tiene existencias (ver
   * aiController, EL CATÁLOGO QUE VE EL ASISTENTE); `productos` solo sigue
   * viajando para un backend viejo que todavía lo use. Lo nuevo es
   * `historial`, lo último que se dijo, para que entienda un "sí" o un
   * "mejor dos" que dependen de lo anterior.
   */
  entenderPedido: async ({ frase, productos, carrito, historial }) => {
    try {
      // enSilencio: si la IA no contesta, el asistente pide que le repitan y
      // ya. Ni aviso rojo ni sesión cerrada. Ver api.js.
      // Y con tope: alguien está esperando parado; si el servidor no contesta
      // en 15 s, mejor decirlo que dejarlo mirando la pantalla.
      const response = await api.post('/ai/entender', { frase, productos, carrito, historial }, { enSilencio: true, timeout: 15000 });
      return response.data;
    } catch {
      return { accion: 'ninguna', entendido: false, origen: 'sin-red' };
    }
  },

  /*
   * Despierta el servidor apenas se abre el asistente. Render lo duerme si no
   * hay tráfico y la primera pregunta tardaba medio minuto; así arranca
   * mientras la persona todavía está leyendo la pantalla. No gasta IA y no
   * importa si falla.
   */
  despertar: () => {
    api.get('/ai/listo', { enSilencio: true }).catch(() => {});
  },
};
