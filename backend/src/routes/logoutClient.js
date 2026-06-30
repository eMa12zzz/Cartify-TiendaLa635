import express from "express";
import logoutController from "../controller/Clients/logoutClient.js";

const router = express.Router();

router.route("/").post(logoutController.logout);

export default router;
