import express from "express";
import orderController from "../controller/orderController.js";

const router = express.Router();

router
  .route("/")
  .get(orderController.getOrders)      // GET  /api/order        -> todos (empleado), ?status= opcional
  .post(orderController.createOrder);  // POST /api/order        -> crear pedido (checkout)

router
  .route("/client/:clientId")
  .get(orderController.getOrdersByClient); // GET /api/order/client/:clientId -> pedidos de un cliente

router
  .route("/:id/status")
  .put(orderController.updateOrderStatus); // PUT /api/order/:id/status -> cambiar estado

export default router;
