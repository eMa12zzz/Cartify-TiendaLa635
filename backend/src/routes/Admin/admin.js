import express from 'express';
import adminController from '../../controller/Admin/adminController.js';

const router = express.Router();

router.route("/")
    .get(adminController.getAdmins)
    .post(adminController.insertAdmin);

router.route("/:id")
    .put(adminController.updateAdmin)
    .get(adminController.getAdmins)
    .delete(adminController.deleteAdmin);

export default router;