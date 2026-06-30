import express from "express";
import clientController from "../controller/Clients/clientController.js";
import upload from "../utils/cloudinaryConfig.js";

const router = express.Router();

router
  .route("/")
  .get(clientController.getClients);

router
  .route("/:id")
  .put(upload.single("image"), clientController.updateClient)
  .delete(clientController.deleteClient);

export default router;