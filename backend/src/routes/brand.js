import express from 'express';
import brandController from '../controller/brand.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Gestión CRUD de marcas.
 */

/**
 * @swagger
 * /brand:
 *   get:
 *     summary: Lista todas las marcas
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Arreglo de marcas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea una nueva marca
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrandInput'
 *     responses:
 *       201:
 *         description: Marca creada exitosamente.
 *       400:
 *         description: El nombre es obligatorio o ya existe una marca con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(brandController.getBrand)
    .post(brandController.insertBrand);

/**
 * @swagger
 * /brand/{id}:
 *   get:
 *     summary: Obtiene marcas (usa el mismo listado que GET /brand)
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la marca.
 *     responses:
 *       200:
 *         description: Arreglo de marcas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza una marca existente
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la marca a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrandInput'
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente.
 *       400:
 *         description: El nombre es requerido.
 *       404:
 *         description: Marca no encontrada.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina una marca
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la marca a eliminar.
 *     responses:
 *       200:
 *         description: Marca eliminada exitosamente.
 *       404:
 *         description: Marca no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(brandController.updateBrand)
    .get(brandController.getBrand)
    .delete(brandController.deleteBrand);

export default router;
