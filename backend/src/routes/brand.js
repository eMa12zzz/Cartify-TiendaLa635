import express from 'express';
import brandController from '../controller/brand.js';

const router = express.Router();

router.route("/")
    .get(brandController.getBrand)
    .post(brandController.insertBrand);

router.route("/:id")
    .put(brandController.updateBrand)
    .get(brandController.getBrand)
    .delete(brandController.deleteBrand);

export default router;