import express from 'express';
import productController from '../controller/product.js';
import upload from '../utils/cloudinaryConfig.js';


import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

/*
 * Ver el catálogo es público: la tienda se mira sin cuenta, esa es la puerta.
 * Tocarlo no. Con el POST/PUT/DELETE abiertos, cualquiera podía cambiarle los
 * precios a la tienda, vaciar existencias o borrar productos.
 */

router.route("/")
    .get(productController.getProduct)
    .post(soloPersonal, upload.single('image'), productController.insertProduct);

router.route("/:id")
    .put(soloPersonal, upload.single('image'), productController.updateProduct)
    .get(productController.getProduct)
    .delete(soloPersonal, productController.deleteProduct);

export default router;