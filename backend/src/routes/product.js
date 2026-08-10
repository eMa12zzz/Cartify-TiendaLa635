import express from 'express';
import productController from '../controller/product.js';
import upload from '../utils/cloudinaryConfig.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión del catálogo de productos.
 */

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Lista todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Arreglo de productos con typeId, brandId, moduleId y supplierId poblados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *       400:
 *         description: Faltan campos requeridos o el código de barras ya está en uso.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(productController.getProduct)
    .post(upload.single('image'), productController.insertProduct);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Obtiene un producto (usa el mismo listado que GET /product)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del producto.
 *     responses:
 *       200:
 *         description: Arreglo de productos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un producto existente
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del producto a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente.
 *       400:
 *         description: Faltan campos requeridos o el código de barras ya está en uso por otro producto.
 *       404:
 *         description: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un producto (y su imagen en Cloudinary)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del producto a eliminar.
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente.
 *       404:
 *         description: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(upload.single('image'), productController.updateProduct)
    .get(productController.getProduct)
    .delete(productController.deleteProduct);

export default router;