import express from "express";
import descargasPanelController from "../controller/descargasPanelController.js";
import { soloPersonal } from "../middlewares/validarSesion.js";
import { TAMANO_MAXIMO } from "../utils/descargasPanel.js";

/**
 * @swagger
 * tags:
 *   name: Descargas del panel
 *   description: Los reportes del panel que se bajan desde la app del teléfono.
 *
 * /descargas:
 *   post:
 *     summary: Guarda un reporte del panel por dos minutos (solo personal)
 *     description: El cuerpo es el archivo tal cual (application/pdf, text/calendar o text/csv). Devuelve la clave para bajarlo.
 *     tags: [Descargas del panel]
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ clave }"
 *       400:
 *         description: Tipo no permitido, archivo vacío o demasiado grande.
 *       401:
 *         description: Sin sesión del personal.
 *
 * /descargas/{clave}/{nombre}:
 *   get:
 *     summary: Baja el reporte guardado (como archivo adjunto)
 *     tags: [Descargas del panel]
 *     responses:
 *       200:
 *         description: El archivo.
 *       404:
 *         description: La clave no existe o ya venció.
 */

const router = express.Router();

// El archivo llega crudo, no como JSON: el lector de JSON de app.js lo deja pasar.
router.post("/", soloPersonal, express.raw({ type: () => true, limit: TAMANO_MAXIMO }), descargasPanelController.guardar);
router.get("/:clave/:nombre", descargasPanelController.entregar);

export default router;
