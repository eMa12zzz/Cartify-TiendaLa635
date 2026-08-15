import express from 'express';
import promotionController from '../controller/promotionController.js';
import upload from '../utils/cloudinaryConfig.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

// Las promociones se ven en la portada sin cuenta; crearlas y borrarlas no.

router.route("/")
    .get(promotionController.getPromotions)
    .post(soloPersonal, upload.single("image"), promotionController.insertPromotion);

router.route("/:id")
    .put(soloPersonal, upload.single("image"), promotionController.updatePromotion)
    .delete(soloPersonal, promotionController.deletePromotion);

export default router;