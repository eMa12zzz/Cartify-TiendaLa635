import express from 'express';
import printMaterialController from '../controller/printMaterialController.js';

import { soloAdmin } from "../middlewares/validarSesion.js";

const router = express.Router();

// Qué papeles hay se consulta al pedir una impresión; las existencias las
// mueve el panel.

router.route("/")
  .get(printMaterialController.getMaterials)
  .post(soloAdmin, printMaterialController.insertMaterial);

// Ajustar solo la existencia: lo que se hace a diario cuando llega el papel
// o se acaba un cartucho, sin volver a mandar toda la ficha.
router.route("/:id/existencia")
  .patch(soloAdmin, printMaterialController.ajustarExistencia);

router.route("/:id")
  .put(soloAdmin, printMaterialController.updateMaterial)
  .delete(soloAdmin, printMaterialController.deleteMaterial);

export default router;
