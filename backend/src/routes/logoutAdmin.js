import express from "express";
import logoutController from "../controller/Admin/logoutAdmin.js";

const router = express.Router();

/**
 * @swagger
 * /logoutAdmin:
 *   post:
 *     summary: Cierra la sesión del administrador
 *     tags: [Admin Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada. Limpia la cookie authCookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada
 */
router.route("/").post(logoutController.logout);

export default router;
