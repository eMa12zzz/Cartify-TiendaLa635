import express from 'express';
import printServiceController from '../controller/printServiceController.js';

import { soloAdmin } from "../middlewares/validarSesion.js";

const router = express.Router();

// Los servicios de impresión y sus precios se consultan desde la tienda; el
// catálogo lo arma el panel.

router.route("/")
  .get(printServiceController.getServices)
  .post(soloAdmin, printServiceController.insertService);

router.route("/:id")
  .put(soloAdmin, printServiceController.updateService)
  .delete(soloAdmin, printServiceController.deleteService);

export default router;
