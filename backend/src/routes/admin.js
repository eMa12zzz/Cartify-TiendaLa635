import express from 'express';
import adminController from '../controller/Admin/adminController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Gestión CRUD de administradores.
 */

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Lista todos los administradores
 *     tags: [Admins]
 *     responses:
 *       200:
 *         description: Arreglo de administradores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo administrador
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginInput'
 *     responses:
 *       201:
 *         description: Administrador creado exitosamente.
 *       400:
 *         description: Faltan campos obligatorios, el formato del correo es inválido, o ya existe un administrador con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(adminController.getAdmins)
    .post(adminController.insertAdmin);

/**
 * @swagger
 * /admin/{id}:
 *   get:
 *     summary: Obtiene administradores (usa el mismo listado que GET /admin)
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del administrador.
 *     responses:
 *       200:
 *         description: Arreglo de administradores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un administrador existente
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del administrador a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/AdminLoginInput'
 *             description: password es opcional aquí; si se omite, se conserva la contraseña actual.
 *     responses:
 *       200:
 *         description: Administrador actualizado exitosamente.
 *       400:
 *         description: Faltan email/userName o el formato del correo es inválido.
 *       404:
 *         description: Administrador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un administrador
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del administrador a eliminar.
 *     responses:
 *       200:
 *         description: Administrador eliminado exitosamente.
 *       404:
 *         description: Administrador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(adminController.updateAdmin)
    .get(adminController.getAdmins)
    .delete(adminController.deleteAdmin);

export default router;
