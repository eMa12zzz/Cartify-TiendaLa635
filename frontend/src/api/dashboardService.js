import api from './api';

/*
 * SERVICIO DEL DASHBOARD — dashboardService.js
 * Una sola llamada trae todo el resumen del admin ya agregado por el backend.
 */
export const dashboardService = {
  // periodo: 'semana' | 'mes' | 'anio' (afecta la gráfica de ventas vs compras)
  getSummary: async (periodo = 'mes') => {
    const response = await api.get('/dashboard/summary', { params: { periodo } });
    return response.data;
  },
};
