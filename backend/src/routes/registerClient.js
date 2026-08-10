import express from "express";

// 1. IMPORTAMOS TU CONFIGURACIÓN DE CLOUDINARY QUE YA TIENES CREADA
import upload from "../utils/cloudinaryConfig.js";

import registerclients from "../controller/Clients/registerClient.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Registration
 *   description: Registro de clientes con verificación de correo por código.
 */

/**
 * @swagger
 * /registerClient:
 *   post:
 *     summary: Inicia el registro de un cliente y envía un código de verificación por correo
 *     tags: [Client Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ClientRegisterInput'
 *     responses:
 *       200:
 *         description: Correo con el código de verificación enviado. Los datos quedan temporalmente en la cookie registrationCookie (15 min) hasta verificar el código.
 *       400:
 *         description: Ya existe un cliente registrado con ese correo.
 *       500:
 *         description: Error interno del servidor o error al enviar el correo.
 */
// 2. AGREGAMOS EL UPLOAD EN LA RUTA
router.route("/").post(
  upload.single("image"), // ¡Esto usa tu propia configuración para subir la foto!
  registerclients.register
);

/**
 * @swagger
 * /registerClient/verifyCodeEmail:
 *   post:
 *     summary: Verifica el código enviado por correo y crea el cliente en la base de datos
 *     tags: [Client Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailCodeInput'
 *     responses:
 *       200:
 *         description: Cliente registrado exitosamente. Limpia la cookie registrationCookie.
 *       400:
 *         description: Código inválido o la sesión de verificación expiró (falta registrationCookie).
 *       500:
 *         description: Error interno del servidor o token inválido/expirado.
 */
router.route("/verifyCodeEmail").post(registerclients.verifyCode);

/**
 * @swagger
 * /registerClient/all:
 *   get:
 *     summary: Lista todos los clientes registrados
 *     tags: [Client Registration]
 *     responses:
 *       200:
 *         description: Arreglo de clientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       500:
 *         description: Error al obtener los clientes.
 */
router.route("/all").get(registerclients.getAll);

export default router;
