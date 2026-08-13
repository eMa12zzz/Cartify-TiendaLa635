import express from 'express';
import adminController from '../controller/Admin/adminController.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

/*
 * Las cuentas de administrador: la llave del panel entero. Con esto abierto,
 * la lista de admins —y su hash— se consultaba sin nada.
 */
router.use(soloPersonal);

router.route("/")
    .get(adminController.getAdmins)
    .post(adminController.insertAdmin);

router.route("/:id")
    .put(adminController.updateAdmin)
    .get(adminController.getAdmins)
    .delete(adminController.deleteAdmin);

export default router;