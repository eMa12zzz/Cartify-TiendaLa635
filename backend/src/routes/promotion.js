import express from 'express';
import promotionController from '../controller/promotionController.js';
import upload from '../utils/cloudinaryConfig.js';

const router = express.Router();

router.route("/")
    .get(promotionController.getPromotions)
    .post(upload.single("image"), promotionController.insertPromotion);

router.route("/:id")
    .put(upload.single("image"), promotionController.updatePromotion)
    .delete(promotionController.deletePromotion);

export default router;