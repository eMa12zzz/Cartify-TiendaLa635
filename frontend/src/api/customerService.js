import api from './api';

/*
 * ============================================================
 * SERVICIO DE CLIENTES — customerService.js
 * ============================================================
 * Centraliza las peticiones HTTP del módulo de clientes.
 * Nota: la ruta de obtención de clientes usa el endpoint de
 * registro (/registerClient/all) porque el controlador de registro
 * también expone la función getAll para el panel administrativo.
 * ============================================================
 */
export const customerService = {
  // 1- Obtener todos los clientes registrados (SELECT)
  getCustomers: async () => {
    const response = await api.get('/registerClient/all');
    return response.data;
  }
};
