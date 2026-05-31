import express from 'express';
import productTypeController from '../controller/productType.js';

const router = express.Router();

router.route("/")
    .get(productTypeController.getProductTypes)
    .post(productTypeController.insertProductType);

router.route("/:id")
    .put(productTypeController.updateProductType)
    .get(productTypeController.getProductTypes)
    .delete(productTypeController.deleteProductType);

export default router;