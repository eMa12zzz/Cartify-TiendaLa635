import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import errorRegistradoModel from "../models/errorRegistrado.js";
import { limpiarReporte, registrarError } from "../utils/registroErrores.js";
import { soloAdmin } from "../middlewares/validarSesion.js";

/*
 * ============================================================
 * /api/errores — ver utils/registroErrores.js
 * ============================================================
 * POST  (público)   la web y la app avisan que algo falló.
 * GET   (admin)     la lista para el panel, lo más reciente primero.
 * PATCH (admin)     marcar uno como resuelto, o reabrirlo.
 * ============================================================
 */
const router = express.Router();

/*
 * Público a propósito (quien falla puede no tener sesión), así que con tope:
 * un navegador roto en bucle no puede llenar la base. Las clientas ya
 * mandan como mucho 10 por visita (utils/reportarError.js).
 */
const topeReportes = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados reportes seguidos" },
});

/*
 * La web los manda como texto plano (text/plain) a propósito: es una
 * petición "simple" que no necesita el permiso previo de CORS, así sale
 * aunque la página se esté cerrando. Aquí se lee ese texto como JSON.
 */
router.post(
  "/",
  topeReportes,
  express.text({ type: "text/plain", limit: "16kb" }),
  async (req, res) => {
    let cuerpo = req.body;
    if (typeof cuerpo === "string") {
      try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = null; }
    }
    const reporte = limpiarReporte(cuerpo);
    if (!reporte) return res.status(400).json({ message: "Reporte incompleto" });
    await registrarError(reporte);
    // 204: no hay nada que contestar, y quien reporta no espera respuesta.
    return res.status(204).end();
  }
);

router.get("/", soloAdmin, async (req, res) => {
  try {
    const filtro = req.query.estado === "resueltos" ? { resuelto: true } : { resuelto: false };
    const errores = await errorRegistradoModel.find(filtro).sort({ ultimaVez: -1 }).limit(200).lean();
    const abiertos = await errorRegistradoModel.countDocuments({ resuelto: false });
    return res.status(200).json({ errores, abiertos });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.patch("/:id", soloAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Ese error no existe" });
  }
  try {
    const actualizado = await errorRegistradoModel.findByIdAndUpdate(
      req.params.id,
      { $set: { resuelto: Boolean(req.body?.resuelto) } },
      { new: true }
    ).lean();
    if (!actualizado) return res.status(404).json({ message: "Ese error no existe" });
    return res.status(200).json(actualizado);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
