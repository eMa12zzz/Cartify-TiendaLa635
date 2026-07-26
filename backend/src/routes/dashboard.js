import express from "express";
import dashboardController from "../controller/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/summary?periodo=semana|mes|anio
router.route("/summary").get(dashboardController.getSummary);

export default router;
