import express from 'express';
import moduleController from '../controller/module.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

// Los módulos son los pasillos de la tienda: se ven sin cuenta, se crean desde
// el panel.

router.route("/")
    .get(moduleController.getModule)
    .post(soloPersonal, moduleController.insertModule);

router.route("/:id")
    .put(soloPersonal, moduleController.updateModule)
    .get(moduleController.getModule)
    .delete(soloPersonal, moduleController.deleteModule);

export default router;