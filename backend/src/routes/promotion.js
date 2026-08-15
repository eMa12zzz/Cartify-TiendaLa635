import express from 'express';
import promotionController from '../controller/promotionController.js';
import upload from '../utils/cloudinaryConfig.js';

import { soloAdmin } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las promociones se ven en la portada sin cuenta; crearlas y borrarlas no.

router.route("/")
    .get(promotionController.getPromotions)
    .post(soloAdmin, upload.single("image"), promotionController.insertPromotion);

router.route("/:id")
    .put(soloAdmin, upload.single("image"), promotionController.updatePromotion)
    .delete(soloAdmin, promotionController.deletePromotion);

export default router;