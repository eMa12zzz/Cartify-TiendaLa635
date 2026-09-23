import express from 'express';
import aiController from '../controller/aiController.js';

import { soloPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

/*
 * Estas rutas gastan cuota de Gemini, que es gratis pero limitada: abiertas,
 * cualquiera podía quemarle la cuota del día a la tienda con un bucle.
 *
 * "entender" se queda pública porque la usa el asistente por voz del kiosco,
 * que a propósito NO tiene sesión. Las otras dos las llama solo el panel.
 */

// Redacta el texto de una promoción a partir de los productos seleccionados.
router.route("/promo-copy")
    .post(soloPersonal, aiController.generarCopyPromo);

// El asistente la toca al abrirse: despierta el servidor (Render se duerme)
// y deja el catálogo en memoria antes de que la persona hable. No gasta IA.
router.route("/listo")
    .get(aiController.listo);

// Descifra lo que pidió el cliente por voz cuando las reglas no lo entienden.
router.route("/entender")
    .post(aiController.entenderPedido);

// Lo mismo, pero con tool calling: puede devolver varias acciones en un
// solo turno ("dos manzanas y una leche"). La usa el asistente de móvil.
router.route("/entender-herramientas")
    .post(aiController.entenderConHerramientas);

// Acomoda en su estante los productos que las reglas del frontend no supieron
// clasificar. Lo que resuelve queda guardado en el producto.
router.route("/clasificar")
    .post(soloPersonal, aiController.clasificarProductos);

export default router;
