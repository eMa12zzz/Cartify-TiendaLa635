import api from './api';

/*
 * ============================================================
 * SERVICIO DE PEDIDOS — orderService.js
 * ============================================================
 * Centraliza las peticiones HTTP de los pedidos de cliente
 * (el modelo Order del backend). Lo usan los hooks del área
 * cliente (Mis Pedidos) y la pantalla del empleado.
 * ============================================================
 */
export const orderService = {
  // Pedidos de UN cliente (su historial) — para "Mis Pedidos" / "Recibidos".
  getMyOrders: async (clientId) => {
    const response = await api.get(`/order/client/${clientId}`);
    return response.data;
  },

  // TODOS los pedidos (pantalla del empleado). status opcional: 'pagado', etc.
  getAllOrders: async (status) => {
    const response = await api.get('/order', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  // Crear un pedido (checkout). data = { clientId, items, paymentMethod?, channel? }
  createOrder: async (data) => {
    const response = await api.post('/order', data);
    return response.data;
  },

  // Cambiar el estado de un pedido (preparando, entregado, cancelado).
  // `quien` deja constancia de quién movió el pedido (lo sella el servidor).
  updateStatus: async (id, status, quien) => {
    const response = await api.put(`/order/${id}/status`, { status, quien });
    return response.data;
  },

  // Crear un pedido de IMPRESIÓN (lleva archivo → FormData).
  createPrintOrder: async (formData) => {
    const response = await api.post('/order/print', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
