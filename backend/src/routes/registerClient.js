import express from "express";

// 1. IMPORTAMOS TU CONFIGURACIÓN DE CLOUDINARY QUE YA TIENES CREADA
import upload from "../utils/cloudinaryConfig.js"; 

import registerclients from "../controller/Clients/registerClient.js";

const router = express.Router();

// 2. AGREGAMOS EL UPLOAD EN LA RUTA
router.route("/").post(
  upload.single("image"), // ¡Esto usa tu propia configuración para subir la foto!
  registerclients.register
);

router.route("/verifyCodeEmail").post(registerclients.verifyCode);

export default router;