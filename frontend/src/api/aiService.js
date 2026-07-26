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
};
