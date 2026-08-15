import express from "express";
import loyaltyController from "../controller/loyaltyController.js";

import { duenoOPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

// Resumen de puntos de un cliente (saldo disponible + vencimientos).
router
  .route("/:clientId/summary")
  // Los puntos son de quien los ganó: cada quien ve los suyos, el personal ve
  // los de todos. Abierto, se leía el saldo de puntos de cualquiera.
  .get(duenoOPersonal("clientId"), loyaltyController.getSummary);

export default router;
