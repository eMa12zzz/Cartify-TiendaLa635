import express from 'express';
import supplierController from '../controller/supplier.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Los proveedores de la tienda, con sus contactos. Cosa del personal.
router.use(soloAdmin);

router.route("/")
    .get(supplierController.getSupplier)
    .post(supplierController.insertSupplier);

router.route("/:id")
    .put(supplierController.updateSupplier)
    .get(supplierController.getSupplier)
    .delete(supplierController.deleteSupplier);

export default router;