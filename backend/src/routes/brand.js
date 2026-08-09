import express from 'express';
import brandController from '../controller/brand.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las marcas se leen desde la tienda (filtros, ficha del producto); se editan
// desde el panel.

router.route("/")
    .get(brandController.getBrand)
    .post(soloPersonal, brandController.insertBrand);

router.route("/:id")
    .put(soloPersonal, brandController.updateBrand)
    .get(brandController.getBrand)
    .delete(soloPersonal, brandController.deleteBrand);

export default router;