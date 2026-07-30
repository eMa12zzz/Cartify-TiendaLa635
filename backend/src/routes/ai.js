import express from 'express';
import aiController from '../controller/aiController.js';

const router = express.Router();

// Redacta el texto de una promoción a partir de los productos seleccionados.
router.route("/promo-copy")
    .post(aiController.generarCopyPromo);

// Descifra lo que pidió el cliente por voz cuando las reglas no lo entienden.
router.route("/entender")
    .post(aiController.entenderPedido);

// Acomoda en su estante los productos que las reglas del frontend no supieron
// clasificar. Lo que resuelve queda guardado en el producto.
router.route("/clasificar")
    .post(aiController.clasificarProductos);

export default router;
