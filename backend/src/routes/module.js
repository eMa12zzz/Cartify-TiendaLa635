import express from 'express';
import moduleController from '../controller/module.js';

const router = express.Router();

router.route("/")
    .get(moduleController.getModule)
    .post(moduleController.insertModule);

router.route("/:id")
    .put(moduleController.updateModule)
    .get(moduleController.getModule)
    .delete(moduleController.deleteModule);

export default router;