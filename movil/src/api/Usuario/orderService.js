/*
 * ============================================================
 * SERVICIO DE PEDIDOS — orderService.js
 * ============================================================
 * Puerto de `frontend/src/api/orderService.js`. MISMOS endpoints (/order/...),
 * MISMOS nombres de método; el transporte pasa a `peticion()` de `../api.js`.
 *
 * Lo usan los hooks del área cliente: Mis Pedidos, Recibidos y Reparto.
 * ============================================================
 */
import { peticion, URL_API } from '../api';

export const orderService = {
  // Pedidos de UN cliente (su historial) — para "Mis Pedidos" / "Recibidos".
  getMyOrders: (clientId) => peticion(`/order/client/${clientId}`),

  // Crear un pedido (checkout). Mismo payload que la web (ShoppingCart):
  // { clientId, items:[{productId,name,price,amount}], paymentMethod,
  //   deliveryType, deliveryAddress?, deliveryReference?, deliveryLat?, deliveryLng?, channel }
  createOrder: (data) => peticion('/order', { metodo: 'POST', cuerpo: data }),

  /*
   * Crear un pedido de IMPRESIÓN. Lleva un archivo, así que va como multipart
   * (fetch directo contra la misma URL_API, sin tocar api.js). formData debe
   * traer: file { uri, name, type }, clientId, serviceId, color, copies, pages,
   * doubleSided, paper.
   */
  createPrintOrder: async (formData) => {
    const res = await fetch(`${URL_API}/order/print`, {
      method: 'POST',
      headers: { Accept: 'application/json' }, // el Content-Type lo pone FormData
      body: formData,
    });
    const datos = await res.json().catch(() => null);
    if (!res.ok) throw new Error(datos?.message || 'No se pudo crear el pedido de impresión');
    return datos;
  },

  // TODOS los pedidos (Reparto). status opcional: 'pagado', etc.
  getAllOrders: (status) =>
    peticion(`/order${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  // Cambiar el estado de un pedido (preparando, entregado, cancelado).
  // `quien` deja constancia de quién movió el pedido (lo sella el servidor).
  updateStatus: (id, status, quien) =>
    peticion(`/order/${id}/status`, { metodo: 'PUT', cuerpo: { status, quien } }),

  // El cliente valora el SERVICIO de entrega de su pedido entregado (1-5).
  rateService: (id, { rating, comment }) =>
    peticion(`/order/${id}/rating`, { metodo: 'PATCH', cuerpo: { rating, comment } }),

  // Seguimiento en vivo. `activo: false` apaga el compartir.
  updateCourierPosition: (id, { lat, lng, quien, activo }) =>
    peticion(`/order/${id}/courier`, { metodo: 'PUT', cuerpo: { lat, lng, quien, activo } }),

  // Dónde va el repartidor de un pedido (se consulta cada pocos segundos).
  getCourierPosition: (id) => peticion(`/order/${id}/courier`),
};

export default orderService;
