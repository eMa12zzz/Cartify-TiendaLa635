import express from 'express';
import moduleController from '../controller/module.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Gestión CRUD de módulos/estantes de la tienda.
 */

/**
 * @swagger
 * /module:
 *   get:
 *     summary: Lista todos los módulos
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: Arreglo de módulos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo módulo
 *     tags: [Modules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       201:
 *         description: Módulo creado exitosamente.
 *       400:
 *         description: El nombre es obligatorio o ya existe un módulo con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(moduleController.getModule)
    .post(moduleController.insertModule);

/**
 * @swagger
 * /module/{id}:
 *   get:
 *     summary: Obtiene módulos (usa el mismo listado que GET /module)
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del módulo.
 *     responses:
 *       200:
 *         description: Arreglo de módulos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un módulo existente
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del módulo a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       200:
 *         description: Módulo actualizado exitosamente.
 *       400:
 *         description: Faltan campos requeridos (name o description).
 *       404:
 *         description: Módulo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un módulo
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del módulo a eliminar.
 *     responses:
 *       200:
 *         description: Módulo eliminado exitosamente.
 *       404:
 *         description: Módulo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(moduleController.updateModule)
    .get(moduleController.getModule)
    .delete(moduleController.deleteModule);

export default router;
