import express from 'express';
import shoppingController from '../controller/shoppingController.js';

const router = express.Router();

router.route("/")
    .get(shoppingController.getShoppings)
    .post(shoppingController.insertShopping);

router.route("/:id")
    .put(shoppingController.updateShopping)
    .delete(shoppingController.deleteShopping);

export default router;