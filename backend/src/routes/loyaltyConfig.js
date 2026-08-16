import express from "express";
import loyaltyConfigController from "../controller/loyaltyConfigController.js";

import { soloAdmin } from "../middlewares/validarSesion.js";

const router = express.Router();

/*
 * Leer la configuración es público: el cliente ve en su cuenta cuántos puntos
 * gana por dólar y cuándo se le vencen, y eso tiene que poder consultarlo.
 * Cambiar la tasa es otra cosa — con esto abierto, cualquiera se regalaba
 * puntos ajustando el multiplicador.
 */
router
  .route("/")
  .get(loyaltyConfigController.getConfig)                    // GET /api/loyaltyConfig -> config actual
  .put(soloAdmin, loyaltyConfigController.updateConfig);  // PUT /api/loyaltyConfig -> editar tasa/vencimiento

export default router;
