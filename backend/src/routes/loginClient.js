import express from "express";
import loginClientController from "../controller/Clients/loginClient.js";

const router = express.Router();

router.post("/login", loginClientController.login);

export default router;