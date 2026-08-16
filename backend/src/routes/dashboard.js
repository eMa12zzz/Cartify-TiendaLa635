import express from "express";
import dashboardController from "../controller/dashboardController.js";

import { soloPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

// Las cifras del negocio: ventas, inversión y ganancia. De la tienda y de nadie más.
router.use(soloPersonal);

// GET /api/dashboard/summary?periodo=semana|mes|anio  -> todo el resumen
router.route("/summary").get(dashboardController.getSummary);

// GET /api/dashboard/chart?periodo=...  -> solo la gráfica (cambio de periodo)
router.route("/chart").get(dashboardController.getChart);

export default router;
