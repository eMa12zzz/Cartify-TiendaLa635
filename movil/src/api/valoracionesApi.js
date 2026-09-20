/*
 * ============================================================
 * VALORACIONES — valoracionesApi.js
 * ============================================================
 * Las dos formas de calificar que ya tiene la web, y que aquí faltaban:
 *
 *   PATCH /order/:id/rating   el SERVICIO de entrega de ese pedido
 *   POST  /review             la reseña de un PRODUCTO
 *
 * ── Por qué son dos cosas distintas ──
 *
 * Una habla del reparto ("llegó rápido", "el repartidor no encontró la casa")
 * y vive dentro del pedido; la otra habla de lo que se compró y alimenta la
 * nota que ve el resto de la tienda en la ficha del producto. Un pedido puede
 * llegar perfecto con un producto malo, y al revés.
 *
 * El backend cuida las dos: el servicio solo lo puede valorar el dueño del
 * pedido, y una vez entregado (`rateService` en orderController.js); la reseña
 * exige haber comprado ese producto (`reviewController.upsert`).
 * ============================================================
 */

import { peticion } from './api';

/*
 * La estrella y el comentario del reparto. El backend acepta de 1 a 5 y
 * recorta el comentario a 500 caracteres; se manda tal cual y él decide.
 */
export const valorarServicio = (pedidoId, { rating, comment = '' }) =>
  peticion(`/order/${pedidoId}/rating`, {
    metodo: 'PATCH',
    cuerpo: { rating, comment },
  });

/*
 * La reseña de un producto. Es un "upsert": si el cliente ya había valorado
 * ese producto, se actualiza en vez de duplicarse — igual que en la web.
 */
export const guardarResena = ({ productId, clientId, rating, comment = '' }) =>
  peticion('/review', {
    metodo: 'POST',
    cuerpo: { productId, clientId, rating, comment },
  });
