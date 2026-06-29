import express from 'express';
import promotionController from '../controller/promotion.js';

const router = express.Router();

router.route("/")
    .get(promotionController.getPromotions)
    .post(promotionController.insertPromotion);

router.route("/:id")
    .put(promotionController.updatePromotion)
    .delete(promotionController.deletePromotion);

export default router;