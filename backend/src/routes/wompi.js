import express from "express";
import wompiController from "../controller/wompiController.js";

import { conSesion } from "../middlewares/validarSesion.js";

const router = express.Router()

/*
 * La pasarela de pago. Todavía no cobra de verdad, pero estas rutas hablan con
 * un servicio externo con las credenciales de la tienda: abiertas, cualquiera
 * las dispara desde afuera. Como mínimo, hay que ser alguien.
 */
router.route("/token").post(conSesion, wompiController.generarToken)
router.route("/paymentTest").post(conSesion, wompiController.paymentTest)
router.route("/payment3DS").post(conSesion, wompiController.payment3DS)

export default router

