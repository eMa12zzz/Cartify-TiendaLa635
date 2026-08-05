import express from "express";
import storeSettingsController from "../controller/storeSettingsController.js";
import upload from "../utils/cloudinaryConfig.js";

const router = express.Router();

router
  .route("/")
  .get(storeSettingsController.getSettings)      // GET  /api/storeSettings -> ajustes actuales
  .put(storeSettingsController.updateSettings);  // PUT  /api/storeSettings -> nombre, lema, portada, temporada

/*
 * El logo va por su propia puerta: cambiarlo es una acción sola y no tiene por
 * qué obligar a reenviar el nombre, el lema y la portada entera. Multer sube
 * la imagen a Cloudinary y el controlador solo guarda la URL que devuelve.
 */
router
  .route("/logo")
  .put(upload.single("logo"), storeSettingsController.updateLogo)
  .delete(storeSettingsController.deleteLogo);

export default router;
