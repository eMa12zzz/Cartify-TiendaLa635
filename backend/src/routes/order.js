import express from "express";
import orderController from "../controller/orderController.js";
import uploadPrint from "../utils/printUpload.js";
import { soloPersonal, conSesion } from "../middlewares/validarSesion.js";
import { identificarComprador } from "../middlewares/identificarComprador.js";

const router = express.Router();

/*
 * Estas rutas estaban TODAS abiertas. Devolvían, a quien preguntara, el
 * historial de compras de cualquier cliente con su dirección y sus coordenadas,
 * y dejaban cambiar el estado de un pedido ajeno.
 *
 * Quién puede qué:
 *   soloPersonal → cosa de la tienda (la lista completa, mover estados, el
 *                  punto del repartidor).
 *   conSesion    → hace falta ser alguien; el controlador comprueba ADEMÁS
 *                  que el pedido sea suyo. Tener sesión no alcanza: sin esa
 *                  segunda comprobación, un cliente leería los pedidos de otro
 *                  cambiando el id de la URL.
 *   sin candado  → solo lo que no es de nadie (ver tiempo-zona).
 */

router
  .route("/")
  // Todos los pedidos de la tienda: la pantalla del empleado.
  .get(soloPersonal, orderController.getOrders)
  // Crear pedido. Ver identificarComprador: el cliente por su cookie, el
  // kiosco por su código, y el personal a nombre de quien cobra en caja.
  .post(identificarComprador, orderController.createOrder);

/*
 * Pedido de impresión. El identificador va DESPUÉS de multer a propósito: hasta
 * que multer no procesa el multipart, req.body viene vacío y el código del
 * kiosco no se podría leer.
 */
router
  .route("/print")
  .post(uploadPrint.single("file"), identificarComprador, orderController.createPrintOrder);

/*
 * Cuánto tardamos de verdad en llegar a un punto, según las entregas pasadas.
 * Va ANTES de /:id/... para que "tiempo-zona" no se lea como un id de pedido.
 *
 * Se queda SIN candado a propósito: devuelve una mediana de la zona, un número
 * agregado que no es de ningún cliente en particular, y se consulta desde el
 * checkout antes de que exista el pedido.
 */
router
  .route("/tiempo-zona")
  .get(orderController.getTiempoPorZona);

// El historial de un cliente. El controlador comprueba que sea el suyo.
router
  .route("/client/:clientId")
  .get(conSesion, orderController.getOrdersByClient);

router
  .route("/:id/status")
  .put(soloPersonal, orderController.updateOrderStatus);

/*
 * Seguimiento en vivo: el repartidor escribe su punto, el cliente lo lee.
 * Escribir es del personal; leer lo necesita el cliente que está esperando su
 * pedido, y el controlador comprueba que el pedido sea suyo.
 */
router
  .route("/:id/courier")
  .get(conSesion, orderController.getCourierPosition)
  .put(soloPersonal, orderController.updateCourierPosition);

export default router;
