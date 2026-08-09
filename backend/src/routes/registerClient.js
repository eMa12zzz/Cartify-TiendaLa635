import express from "express";

// 1. IMPORTAMOS TU CONFIGURACIÓN DE CLOUDINARY QUE YA TIENES CREADA
import upload from "../utils/cloudinaryConfig.js"; 

import registerclients from "../controller/Clients/registerClient.js";
import { soloPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

// 2. AGREGAMOS EL UPLOAD EN LA RUTA
router.route("/").post(
  upload.single("image"), // ¡Esto usa tu propia configuración para subir la foto!
  registerclients.register
);

router.route("/verifyCodeEmail").post(registerclients.verifyCode);

/*
 * La lista completa de clientes. Es la que consume la pantalla de Clientes del
 * panel, así que es de PERSONAL y de nadie más: aquí van nombres, teléfonos,
 * DUI, saldos y direcciones con coordenadas de toda la clientela de la tienda.
 * Estaba abierta a internet. Ver middlewares/validarSesion.js.
 */
router.route("/all").get(soloPersonal, registerclients.getAll);

export default router;