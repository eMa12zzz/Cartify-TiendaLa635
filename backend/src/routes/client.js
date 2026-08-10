import express from "express";
import clientController from "../controller/Clients/clientController.js";
import upload from "../utils/cloudinaryConfig.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestión de clientes (administración y autoservicio "Mi Cuenta").
 */

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Lista todos los clientes
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Arreglo de clientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(clientController.getClients);

/**
 * @swagger
 * /client/{id}:
 *   get:
 *     summary: Obtiene un cliente por id (sin el campo password)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     responses:
 *       200:
 *         description: Cliente encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un cliente (uso administrativo)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ClientUpdateInput'
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente. Devuelve el cliente actualizado.
 *       400:
 *         description: Faltan campos requeridos (fullName, dui, phoneNumber, ClientAddress, email o userName).
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente a eliminar.
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente.
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/:id")
  .get(clientController.getClientById)
  .put(upload.single("image"), clientController.updateClient)
  .delete(clientController.deleteClient);

/**
 * @swagger
 * /client/{id}/profile:
 *   patch:
 *     summary: El cliente edita su propio perfil (datos básicos)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientProfileUpdateInput'
 *     responses:
 *       200:
 *         description: Perfil actualizado. Devuelve el cliente actualizado (sin password).
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
// El cliente edita su propio perfil (datos básicos, JSON).
router
  .route("/:id/profile")
  .patch(clientController.updateClientProfile);

/**
 * @swagger
 * /client/{id}/addresses:
 *   patch:
 *     summary: El cliente reemplaza su lista de direcciones de entrega
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientAddressesInput'
 *     responses:
 *       200:
 *         description: Direcciones actualizadas. Devuelve el cliente actualizado (sin password).
 *       400:
 *         description: addresses debe ser un arreglo.
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
// El cliente gestiona su lista de direcciones de entrega.
router
  .route("/:id/addresses")
  .patch(clientController.updateAddresses);

/**
 * @swagger
 * /client/{id}/notifications:
 *   patch:
 *     summary: El cliente actualiza sus preferencias de notificación
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientNotificationsInput'
 *     responses:
 *       200:
 *         description: Preferencias actualizadas. Devuelve el cliente actualizado (sin password).
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
// El cliente actualiza sus preferencias de notificación.
router
  .route("/:id/notifications")
  .patch(clientController.updateNotifications);

/**
 * @swagger
 * /client/{id}/payment-methods:
 *   patch:
 *     summary: El cliente reemplaza su lista de métodos de pago (datos no sensibles)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del cliente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientPaymentMethodsInput'
 *     responses:
 *       200:
 *         description: Métodos de pago actualizados. Devuelve el cliente actualizado (sin password).
 *       400:
 *         description: paymentMethods debe ser un arreglo.
 *       404:
 *         description: Cliente no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
// El cliente gestiona sus métodos de pago (datos no sensibles).
router
  .route("/:id/payment-methods")
  .patch(clientController.updatePaymentMethods);

export default router;
