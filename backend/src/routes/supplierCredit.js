import express from 'express';
import supplierCreditController from '../controller/supplierCreditController.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Lo que la tienda le debe a cada proveedor. Cosa del personal.
router.use(soloAdmin);

// Resumen de todos los proveedores (listado y aviso del dashboard).
router.route("/")
    .get(supplierCreditController.getSummary);

// Registrar una compra al crédito o un pago.
router.route("/movimiento")
    .post(supplierCreditController.insertMovement);

router.route("/movimiento/:id")
    .delete(supplierCreditController.deleteMovement);

// Estado de cuenta de un proveedor y su límite.
router.route("/:supplierId")
    .get(supplierCreditController.getAccount)
    .put(supplierCreditController.updateLimit);

export default router;
