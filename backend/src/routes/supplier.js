import express from 'express';
import supplierController from '../controller/supplier.js';

const router = express.Router();

router.route("/")
    .get(supplierController.getSupplier)
    .post(supplierController.insertSupplier);

router.route("/:id")
    .put(supplierController.updateSupplier)
    .get(supplierController.getSupplier)
    .delete(supplierController.deleteSupplier);

export default router;