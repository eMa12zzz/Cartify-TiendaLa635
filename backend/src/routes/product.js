import express from 'express';
import productController from '../controller/product.js';
import upload from '../utils/cloudinaryConfig.js';


import { soloAdmin } from '../middlewares/validarSesion.js';

/*
 * ── Documentación de la API (Swagger) ──
 *
 * Viene de main. Va agrupada aquí y no pegada a cada ruta porque
 * swagger-jsdoc rastrea el archivo entero: dónde esté no cambia lo que
 * documenta, y así el código de las rutas se lee sin interrupciones.
 */

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


const router = express.Router();

/*
 * Ver el catálogo es público: la tienda se mira sin cuenta, esa es la puerta.
 * Tocarlo no. Con el POST/PUT/DELETE abiertos, cualquiera podía cambiarle los
 * precios a la tienda, vaciar existencias o borrar productos.
 */

router.route("/")
    .get(productController.getProduct)
    .post(soloAdmin, upload.single('image'), productController.insertProduct);

router.route("/:id")
    .put(soloAdmin, upload.single('image'), productController.updateProduct)
    .get(productController.getProduct)
    .delete(soloAdmin, productController.deleteProduct);

export default router;