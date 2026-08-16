import express from 'express';
import productTypeController from '../controller/productType.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las categorías se leen desde la tienda; se editan desde el panel.

router.route("/")
    .get(productTypeController.getProductTypes)
    .post(soloAdmin, productTypeController.insertProductType);

router.route("/:id")
    .put(soloAdmin, productTypeController.updateProductType)
    .get(productTypeController.getProductTypes)
    .delete(soloAdmin, productTypeController.deleteProductType);

export default router;