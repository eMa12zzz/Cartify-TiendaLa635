import express from 'express';
import employeeController from '../controller/Employee/employeeController.js';
import upload from '../utils/cloudinaryConfig.js';

import { soloPersonal } from '../middlewares/validarSesion.js';

const router = express.Router();

/*
 * Todo lo de empleados es del personal, sin excepción: aquí se listan, se dan
 * de alta y se borran las cuentas de quienes trabajan en la tienda. Estaba
 * abierto, así que la lista con sus nombres y correos —y hasta ayer con el
 * hash de su contraseña— se la llevaba cualquiera.
 */
router.use(soloPersonal);

router.route("/")
    .get(employeeController.getEmployees)
    .post(upload.single('image'), employeeController.insertEmployee);  

router.route("/:id")
    .put(upload.single('image'), employeeController.updateEmployee)
    .get(employeeController.getEmployees)
    .delete(employeeController.deleteEmployee);

export default router;