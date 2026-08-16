import express from 'express';
import moduleController from '../controller/module.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Los módulos son los pasillos de la tienda: se ven sin cuenta, se crean desde
// el panel.

router.route("/")
    .get(moduleController.getModule)
    .post(soloAdmin, moduleController.insertModule);

router.route("/:id")
    .put(soloAdmin, moduleController.updateModule)
    .get(moduleController.getModule)
    .delete(soloAdmin, moduleController.deleteModule);

export default router;