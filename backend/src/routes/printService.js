import express from 'express';
import printServiceController from '../controller/printServiceController.js';

import { soloPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

// Los servicios de impresión y sus precios se consultan desde la tienda; el
// catálogo lo arma el panel.

router.route("/")
  .get(printServiceController.getServices)
  .post(soloPersonal, printServiceController.insertService);

router.route("/:id")
  .put(soloPersonal, printServiceController.updateService)
  .delete(soloPersonal, printServiceController.deleteService);

export default router;
