import express from "express";
import loyaltyConfigController from "../controller/loyaltyConfigController.js";

const router = express.Router();

router
  .route("/")
  .get(loyaltyConfigController.getConfig)     // GET /api/loyaltyConfig -> config actual
  .put(loyaltyConfigController.updateConfig); // PUT /api/loyaltyConfig -> editar tasa/vencimiento

export default router;
