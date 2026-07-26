import express from 'express';
import aiController from '../controller/aiController.js';

const router = express.Router();

// Redacta el texto de una promoción a partir de los productos seleccionados.
router.route("/promo-copy")
    .post(aiController.generarCopyPromo);

export default router;
