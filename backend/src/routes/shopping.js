import express from 'express';
import shoppingController from '../controller/shoppingController.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las compras a proveedor: lo que le cuesta la mercadería a la tienda.
router.use(soloAdmin);

router.route("/")
    .get(shoppingController.getShoppings)
    .post(shoppingController.insertShopping);

router.route("/:id")
    .put(shoppingController.updateShopping)
    .delete(shoppingController.deleteShopping);

export default router;