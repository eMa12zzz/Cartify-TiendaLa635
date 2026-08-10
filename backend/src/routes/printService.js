import express from 'express';
import printServiceController from '../controller/printServiceController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PrintServices
 *   description: Catálogo de formatos de impresión (módulo Impresiones).
 */

/**
 * @swagger
 * /printService:
 *   get:
 *     summary: Lista todos los servicios de impresión
 *     tags: [PrintServices]
 *     responses:
 *       200:
 *         description: Arreglo de servicios de impresión.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PrintService'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo servicio de impresión
 *     tags: [PrintServices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrintServiceInput'
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente.
 *       400:
 *         description: Nombre y precio por copia son requeridos.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
  .get(printServiceController.getServices)
  .post(printServiceController.insertService);

/**
 * @swagger
 * /printService/{id}:
 *   put:
 *     summary: Actualiza un servicio de impresión existente
 *     tags: [PrintServices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del servicio a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrintServiceInput'
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente.
 *       400:
 *         description: Nombre y precio por copia son requeridos.
 *       404:
 *         description: Servicio no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un servicio de impresión
 *     tags: [PrintServices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del servicio a eliminar.
 *     responses:
 *       200:
 *         description: Servicio eliminado exitosamente.
 *       404:
 *         description: Servicio no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
  .put(printServiceController.updateService)
  .delete(printServiceController.deleteService);

export default router;
