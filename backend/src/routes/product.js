import express from 'express';
import productController from '../controller/product.js';
import upload from '../utils/cloudinaryConfig.js';


const router = express.Router();

router.route("/")
    .get(productController.getProduct)
    .post(upload.single('image'), productController.insertProduct);

router.route("/:id")
    .put(upload.single('image'), productController.updateProduct)
    .get(productController.getProduct)
    .delete(productController.deleteProduct);

export default router;