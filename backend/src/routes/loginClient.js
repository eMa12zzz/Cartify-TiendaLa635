import express from "express";
import loginClientController from "../controller/Clients/loginClient.js";
import googleAuthClientController from "../controller/Clients/googleAuthClient.js";

const router = express.Router();

router.post("/login", loginClientController.login);
// Inicio de sesión con Google. Recibe el ID token del botón del frontend.
router.post("/google", googleAuthClientController.login);

export default router;