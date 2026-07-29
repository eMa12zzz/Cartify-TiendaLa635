import express from "express";
import orderController from "../controller/orderController.js";
import uploadPrint from "../utils/printUpload.js";

const router = express.Router();

router
  .route("/")
  .get(orderController.getOrders)      // GET  /api/order        -> todos (empleado), ?status= opcional
  .post(orderController.createOrder);  // POST /api/order        -> crear pedido (checkout)

router
  .route("/print")
  .post(uploadPrint.single("file"), orderController.createPrintOrder); // POST /api/order/print -> pedido de impresión

router
  .route("/client/:clientId")
  .get(orderController.getOrdersByClient); // GET /api/order/client/:clientId -> pedidos de un cliente

router
  .route("/:id/status")
  .put(orderController.updateOrderStatus); // PUT /api/order/:id/status -> cambiar estado

// Seguimiento en vivo: el repartidor escribe su punto, el cliente lo lee.
router
  .route("/:id/courier")
  .get(orderController.getCourierPosition)      // GET /api/order/:id/courier -> dónde va
  .put(orderController.updateCourierPosition);  // PUT /api/order/:id/courier -> mandar posición

export default router;
