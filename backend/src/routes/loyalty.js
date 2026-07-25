import express from "express";
import loyaltyController from "../controller/loyaltyController.js";

const router = express.Router();

// Resumen de puntos de un cliente (saldo disponible + vencimientos).
router
  .route("/:clientId/summary")
  .get(loyaltyController.getSummary);

export default router;
