import express from "express";
import loginAdminController from "../controller/Admin/loginAdmin.js";

const router = express.Router();

router.post("/login", loginAdminController.login);

export default router;