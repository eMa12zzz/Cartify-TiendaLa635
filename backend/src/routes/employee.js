import express from 'express';
import employeeController from '../controller/Employee/employeeController.js';
import upload from '../utils/cloudinaryConfig.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Gestión CRUD de empleados.
 */

/**
 * @swagger
 * /employee:
 *   get:
 *     summary: Lista todos los empleados
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Arreglo de empleados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo empleado
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Empleado creado exitosamente.
 *       500:
 *         description: Error interno del servidor (el controlador no valida campos faltantes explícitamente; si falta el archivo de imagen u otro dato requerido, la petición fallará).
 */
router.route("/")
    .get(employeeController.getEmployees)
    .post(upload.single('image'), employeeController.insertEmployee);

/**
 * @swagger
 * /employee/{id}:
 *   get:
 *     summary: Obtiene empleados (usa el mismo listado que GET /employee)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del empleado.
 *     responses:
 *       200:
 *         description: Arreglo de empleados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza un empleado existente
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del empleado a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       200:
 *         description: Empleado actualizado exitosamente.
 *       400:
 *         description: Faltan campos requeridos (email, userName, password, fullName, dui o phoneNumber).
 *       404:
 *         description: Empleado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del empleado a eliminar.
 *     responses:
 *       200:
 *         description: Empleado eliminado exitosamente.
 *       404:
 *         description: Empleado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .put(upload.single('image'), employeeController.updateEmployee)
    .get(employeeController.getEmployees)
    .delete(employeeController.deleteEmployee);

export default router;
