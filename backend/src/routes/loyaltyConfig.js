import express from "express";
import loyaltyConfigController from "../controller/loyaltyConfigController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LoyaltyConfig
 *   description: Configuración editable del programa de puntos de fidelidad (documento singleton).
 */

/**
 * @swagger
 * /loyaltyConfig:
 *   get:
 *     summary: Obtiene la configuración actual de puntos (la crea con defaults si aún no existe)
 *     tags: [LoyaltyConfig]
 *     responses:
 *       200:
 *         description: Configuración de fidelidad.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoyaltyConfig'
 *       500:
 *         description: Error interno del servidor.
 *   put:
 *     summary: Actualiza la tasa de puntos y/o los meses de vencimiento
 *     tags: [LoyaltyConfig]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoyaltyConfigInput'
 *     responses:
 *       200:
 *         description: Configuración actualizada (upsert automático si el singleton aún no existía).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Configuración actualizada
 *                 config:
 *                   $ref: '#/components/schemas/LoyaltyConfig'
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(loyaltyConfigController.getConfig)     // GET /api/loyaltyConfig -> config actual
  .put(loyaltyConfigController.updateConfig); // PUT /api/loyaltyConfig -> editar tasa/vencimiento

export default router;
