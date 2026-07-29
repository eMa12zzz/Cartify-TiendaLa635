import express from 'express';
import aiController from '../controller/aiController.js';

const router = express.Router();

// Redacta el texto de una promoción a partir de los productos seleccionados.
router.route("/promo-copy")
    .post(aiController.generarCopyPromo);

// Descifra lo que pidió el cliente por voz cuando las reglas no lo entienden.
router.route("/entender")
    .post(aiController.entenderPedido);

export default router;
