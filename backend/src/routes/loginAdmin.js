import express from "express";
import loginAdminController from "../controller/Admin/loginAdmin.js";

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
 *   name: Admin Auth
 *   description: Autenticación de administradores.
 */

/**
 * @swagger
 * /loginAdmin/login:
 *   post:
 *     summary: Inicia sesión como administrador
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso. Se establece la cookie httpOnly authCookie con el JWT (30 días).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userName:
 *                       type: string
 *       400:
 *         description: Email inválido o contraseña no enviada.
 *       401:
 *         description: Contraseña incorrecta.
 *       403:
 *         description: Cuenta deshabilitada o bloqueada temporalmente por 5 minutos (5 intentos fallidos).
 *       404:
 *         description: Administrador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */


const router = express.Router();

router.post("/login", loginAdminController.login);
router.post("/verify-2fa", loginAdminController.verify2FA);

export default router;