import express from 'express';
import employeeController from '../controller/Employee/employeeController.js';
import upload from '../utils/cloudinaryConfig.js';

const router = express.Router();

router.route("/")
    .get(employeeController.getEmployees)
    .post(upload.single('image'), employeeController.insertEmployee);  

router.route("/:id")
    .put(upload.single('image'), employeeController.updateEmployee)
    .get(employeeController.getEmployeeById)
    .delete(employeeController.deleteEmployee);

router.patch("/:id/toggle", employeeController.toggleActive);

export default router;