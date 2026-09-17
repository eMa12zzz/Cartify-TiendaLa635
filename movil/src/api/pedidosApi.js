/*
 * ============================================================
 * PEDIDOS — pedidosApi.js
 * ============================================================
 * Los pedidos de un cliente: los que ya hizo y el que está haciendo. Los mismos
 * endpoints que `orderService` en la web:
 *
 *   GET  /order/client/:clienteId   su historial
 *   POST /order                     crear el pedido (el checkout)
 *   GET  /order/tiempo-zona         cuánto tardamos en llegar a un punto
 *   GET  /order/:id/courier         dónde va el repartidor, en vivo
 *
 * El historial viene ordenado del más nuevo al más viejo por el backend, con
 * los productos ya poblados. No hace falta reordenarlo aquí, y hacerlo sería
 * quedar a merced de que un día el servidor cambie de criterio y la app siga
 * con el suyo.
 *
 * No hay endpoint para "un solo pedido": la lista ya trae todo lo que se
 * muestra de cada uno.
 *
 * ── Lo que el pedido NO lleva ──
 *
 * Un total. Se manda qué se lleva y a qué precio cada cosa, y el servidor suma:
 * el subtotal, el descuento por puntos y el total salen de allá. Es a propósito
 * —el comentario del controlador lo dice— porque un total que viaja desde el
 * teléfono es un total que se puede editar por el camino.
 * ============================================================
 */

import { peticion } from './api';

export const getPedidosDeCliente = (clienteId) => peticion(`/order/client/${clienteId}`);

export const crearPedido = (datos) => peticion('/order', { metodo: 'POST', cuerpo: datos });

/*
 * Cuánto se ha tardado de verdad en llegar a ese punto, según las entregas ya
 * hechas por ahí. Devuelve `{ hayDatos: false }` cuando todavía no hay
 * historial suficiente, y entonces la pantalla no dice nada: inventar un
 * "30 a 45 minutos" para llenar el hueco es justo lo que este endpoint existe
 * para no tener que hacer.
 */
export const getTiempoPorZona = (lat, lng) =>
  peticion(`/order/tiempo-zona?lat=${lat}&lng=${lng}`);

/*
 * Dónde va el repartidor ahora mismo (y el estado del pedido, de paso). Lo
 * consulta useSeguimientoEnVivo cada pocos segundos mientras el pedido está
 * en curso — ver ese hook para el porqué del "cada pocos segundos" en vez de
 * un socket.
 */
export const getCourierPosition = (pedidoId) => peticion(`/order/${pedidoId}/courier`);
