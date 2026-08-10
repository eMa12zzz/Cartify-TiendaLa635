import express from 'express';
import productTypeController from '../controller/productType.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProductTypes
 *   description: Gestión CRUD de tipos/subtipos de producto.
 */

/**
 * @swagger
 * /productType:
 *   get:
 *     summary: Lista todos los tipos de producto
 *     tags: [ProductTypes]
 *     responses:
 *       200:
 *         description: Arreglo de tipos de producto.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductType'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo tipo de producto
 *     tags: [ProductTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductTypeInput'
 *     responses:
 *       201:
 *         description: Tipo de producto creado exitosamente.
 *       400:
 *         description: Faltan campos requeridos (moduleId, type o subtype).
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(productTypeController.getProductTypes)
    .post(productTypeController.insertProductType);

/**
 * @swagger
 * /productType/{id}:
 *   get:
 *     summary: Obtiene tipos de producto (usa el mismo listado que GET /productType)
 *     tags: [ProductTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del tipo de producto.
 *     responses:
 *       200:
 *         description: Arreglo de tipos de producto.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductType'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un tipo de producto existente
 *     tags: [ProductTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del tipo de producto a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductTypeInput'
 *     responses:
 *       200:
 *         description: Tipo de producto actualizado exitosamente.
 *       400:
 *         description: Faltan campos requeridos (moduleId, type o subtype).
 *       404:
 *         description: Tipo de producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un tipo de producto
 *     tags: [ProductTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del tipo de producto a eliminar.
 *     responses:
 *       200:
 *         description: Tipo de producto eliminado exitosamente.
 *       404:
 *         description: Tipo de producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(productTypeController.updateProductType)
    .get(productTypeController.getProductTypes)
    .delete(productTypeController.deleteProductType);

export default router;
