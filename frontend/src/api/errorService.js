import api from './api';

/*
 * Los errores que anotaron la web, la app y el servidor (ver
 * backend/src/routes/errores.js). Solo el administrador los ve.
 */
export const errorService = {
  // estado: 'abiertos' | 'resueltos'
  listar: async (estado = 'abiertos') => {
    const response = await api.get('/errores', { params: { estado } });
    return response.data;
  },

  marcar: async (id, resuelto) => {
    const response = await api.patch(`/errores/${id}`, { resuelto });
    return response.data;
  },
};
