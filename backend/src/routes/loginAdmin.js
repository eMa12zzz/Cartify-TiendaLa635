import express from "express";
import loginAdminController from "../controller/Admin/loginAdmin.js";

const router = express.Router();

router.post("/login", loginAdminController.login);
router.post("/verify-2fa", loginAdminController.verify2FA);

export default router;