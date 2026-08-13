import express from 'express';
import productTypeController from '../controller/productType.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las categorías se leen desde la tienda; se editan desde el panel.

router.route("/")
    .get(productTypeController.getProductTypes)
    .post(soloPersonal, productTypeController.insertProductType);

router.route("/:id")
    .put(soloPersonal, productTypeController.updateProductType)
    .get(productTypeController.getProductTypes)
    .delete(soloPersonal, productTypeController.deleteProductType);

export default router;