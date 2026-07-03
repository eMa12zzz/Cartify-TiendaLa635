import express from "express";
import logoutController from "../controller/Admin/logoutAdmin.js";

const router = express.Router();

router.route("/").post(logoutController.logout);

export default router;
