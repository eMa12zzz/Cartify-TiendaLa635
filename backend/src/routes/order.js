import express from "express";
import orderController from "../controller/orderController.js";
import uploadPrint from "../utils/printUpload.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Pedidos de clientes (checkout, impresión, historial y cambio de estado).
 */

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Lista todos los pedidos (pantalla del empleado)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pagado, preparando, entregado, cancelado]
 *         description: Filtra por estado del pedido.
 *     responses:
 *       200:
 *         description: Arreglo de pedidos, con clientId (fullName, email, phoneNumber) e items.productId poblados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un pedido (checkout). Otorga puntos de fidelidad según la configuración activa.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreateInput'
 *     responses:
 *       201:
 *         description: Pedido creado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido creado
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 pointsEarned:
 *                   type: number
 *       400:
 *         description: clientId e items son requeridos.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(orderController.getOrders)      // GET  /api/order        -> todos (empleado), ?status= opcional
  .post(orderController.createOrder);  // POST /api/order        -> crear pedido (checkout)

/**
 * @swagger
 * /order/print:
 *   post:
 *     summary: Crea un pedido de impresión (sube archivo y calcula el precio según el servicio)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PrintOrderInput'
 *     responses:
 *       201:
 *         description: Pedido de impresión creado. Intenta enviarse por correo a la impresora (emailedToPrinter indica si tuvo éxito).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido de impresión creado
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 emailedToPrinter:
 *                   type: boolean
 *       400:
 *         description: Faltan clientId/serviceId, o no se subió el archivo a imprimir.
 *       404:
 *         description: Servicio de impresión no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/print")
  .post(uploadPrint.single("file"), orderController.createPrintOrder); // POST /api/order/print -> pedido de impresión

/**
 * @swagger
 * /order/client/{clientId}:
 *   get:
 *     summary: Lista los pedidos de un cliente (su historial), del más reciente al más antiguo
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     responses:
 *       200:
 *         description: Arreglo de pedidos del cliente, con items.productId poblado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/client/:clientId")
  .get(orderController.getOrdersByClient); // GET /api/order/client/:clientId -> pedidos de un cliente

/**
 * @swagger
 * /order/{id}/status:
 *   put:
 *     summary: Cambia el estado de un pedido (preparando, entregado, cancelado, pagado)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del pedido.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusInput'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Estado actualizado
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Estado inválido.
 *       404:
 *         description: Pedido no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/:id/status")
  .put(orderController.updateOrderStatus); // PUT /api/order/:id/status -> cambiar estado

export default router;
