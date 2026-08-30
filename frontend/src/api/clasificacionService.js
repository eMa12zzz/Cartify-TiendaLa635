import api from './api';

/*
 * SERVICIO DE CLASIFICACIÓN — clasificacionService.js
 *
 * Le pregunta al backend a qué estante va lo que las reglas locales no supieron
 * acomodar. Va aparte de aiService.js a propósito: aquí no se le pide texto a
 * la IA, se le pide que ORDENE el inventario, y el backend además guarda la
 * respuesta en el producto para no volver a preguntar nunca por lo mismo.
 */
export const clasificacionService = {
  /*
   * Nunca lanza error. Esto corre mientras un cliente está viendo la tienda: si
   * la IA no está configurada, se acabó la cuota o no hay internet, la portada
   * simplemente se arma sin esas filas extra. Que se caiga la IA no puede
   * ensuciarle la pantalla a quien vino a comprar arroz.
   */
  clasificarProductos: async (productos) => {
    try {
      // enSilencio: esto corre solo, mientras alguien mira la tienda. Un fallo
      // aquí no puede pintar un aviso ni cerrarle la sesión. Ver api.js.
      const response = await api.post('/ai/clasificar', { productos }, { enSilencio: true });
      return response.data;
    } catch {
      return { familias: [], origen: 'sin-red' };
    }
  },
};
