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

  // El cliente valora el SERVICIO de entrega de su pedido entregado (1-5 estrellas).
  rateService: async (id, { rating, comment }) => {
    const response = await api.patch(`/order/${id}/rating`, { rating, comment });
    return response.data;
  },

  /*
   * Seguimiento en vivo. El repartidor escribe su punto mientras maneja;
   * `activo: false` apaga el compartir y borra la última posición.
   */
  updateCourierPosition: async (id, { lat, lng, quien, activo }) => {
    const response = await api.put(`/order/${id}/courier`, { lat, lng, quien, activo });
    return response.data;
  },

  // Dónde va el repartidor de un pedido. Se consulta cada pocos segundos,
  // por eso el backend devuelve solo el punto y no el pedido completo.
  getCourierPosition: async (id) => {
    const response = await api.get(`/order/${id}/courier`);
    return response.data;
  },

  /*
   * Cuánto tardamos de verdad en llegar a un punto, según las entregas ya
   * hechas por esa zona. Devuelve { hayDatos, entregas, tipico, holgado }.
   */
  getTiempoPorZona: async (lat, lng) => {
    const response = await api.get('/order/tiempo-zona', { params: { lat, lng } });
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
