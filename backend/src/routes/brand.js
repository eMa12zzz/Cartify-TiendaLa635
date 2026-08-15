import express from 'express';
import brandController from '../controller/brand.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las marcas se leen desde la tienda (filtros, ficha del producto); se editan
// desde el panel.

router.route("/")
    .get(brandController.getBrand)
    .post(soloAdmin, brandController.insertBrand);

router.route("/:id")
    .put(soloAdmin, brandController.updateBrand)
    .get(brandController.getBrand)
    .delete(soloAdmin, brandController.deleteBrand);

export default router;