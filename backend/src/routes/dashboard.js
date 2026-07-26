import express from "express";
import dashboardController from "../controller/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/summary?periodo=semana|mes|anio  -> todo el resumen
router.route("/summary").get(dashboardController.getSummary);

// GET /api/dashboard/chart?periodo=...  -> solo la gráfica (cambio de periodo)
router.route("/chart").get(dashboardController.getChart);

export default router;
