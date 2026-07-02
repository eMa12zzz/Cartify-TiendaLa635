import { Router } from "express";
import authFlowController from "../controller/Clients/authFlowController.js";
import loginClientController from "../controller/Clients/loginClient.js"; // Reuse existing login for existing users

const router = Router();

router.route("/login-step-1").post(authFlowController.loginStep1);
router.route("/login-step-2").post(authFlowController.loginStep2);
router.post("/create-password", authFlowController.createPassword);

// Since login-password just needs to verify existing users, we can use the existing login
router.post("/login-password", loginClientController.login);

export default router;
