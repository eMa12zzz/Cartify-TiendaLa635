import express from 'express';
import promotionController from '../controller/promotionController.js';
import upload from '../utils/cloudinaryConfig.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Gestión de promociones (descuento, precio fijo o NxM) aplicadas en tienda y carrito.
 */

/**
 * @swagger
 * /promotion:
 *   get:
 *     summary: Lista todas las promociones
 *     tags: [Promotions]
 *     responses:
 *       200:
 *         description: Arreglo de promociones, con items.productId poblado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Promotion'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea una nueva promoción
 *     tags: [Promotions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PromotionInput'
 *     responses:
 *       201:
 *         description: Promoción creada exitosamente.
 *       400:
 *         description: Falta la descripción o no se agregó ningún producto (items vacío).
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(promotionController.getPromotions)
    .post(upload.single("image"), promotionController.insertPromotion);

/**
 * @swagger
 * /promotion/{id}:
 *   put:
 *     summary: Actualiza una promoción existente
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la promoción a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PromotionInput'
 *     responses:
 *       200:
 *         description: Promoción actualizada exitosamente.
 *       400:
 *         description: Falta la descripción o no se agregó ningún producto (items vacío).
 *       404:
 *         description: Promoción no encontrada.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina una promoción (y su imagen en Cloudinary)
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la promoción a eliminar.
 *     responses:
 *       200:
 *         description: Promoción eliminada exitosamente.
 *       404:
 *         description: Promoción no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(upload.single("image"), promotionController.updatePromotion)
    .delete(promotionController.deletePromotion);

export default router;
