import express from 'express';
import printMaterialController from '../controller/printMaterialController.js';

const router = express.Router();

router.route("/")
  .get(printMaterialController.getMaterials)
  .post(printMaterialController.insertMaterial);

// Ajustar solo la existencia: lo que se hace a diario cuando llega el papel
// o se acaba un cartucho, sin volver a mandar toda la ficha.
router.route("/:id/existencia")
  .patch(printMaterialController.ajustarExistencia);

router.route("/:id")
  .put(printMaterialController.updateMaterial)
  .delete(printMaterialController.deleteMaterial);

export default router;
