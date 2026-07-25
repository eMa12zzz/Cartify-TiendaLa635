import express from 'express';
import printServiceController from '../controller/printServiceController.js';

const router = express.Router();

router.route("/")
  .get(printServiceController.getServices)
  .post(printServiceController.insertService);

router.route("/:id")
  .put(printServiceController.updateService)
  .delete(printServiceController.deleteService);

export default router;
