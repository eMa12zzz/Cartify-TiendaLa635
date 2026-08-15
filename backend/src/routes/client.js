import express from "express";
import clientController from "../controller/Clients/clientController.js";
import upload from "../utils/cloudinaryConfig.js";

const router = express.Router();

router
  .route("/")
  .get(clientController.getClients);

router
  .route("/:id")
  .get(clientController.getClientById)
  .put(upload.single("image"), clientController.updateClient)
  .delete(clientController.deleteClient);

// El cliente edita su propio perfil (datos básicos, y opcionalmente su foto).
router
  .route("/:id/profile")
  .patch(upload.single("image"), clientController.updateClientProfile);

// Los productos que el cliente marcó con el corazón.
router
  .route("/:id/favorites")
  .get(clientController.getFavorites)
  .patch(clientController.toggleFavorite);

// El cliente gestiona su lista de direcciones de entrega.
router
  .route("/:id/addresses")
  .patch(clientController.updateAddresses);

// El cliente actualiza sus preferencias de notificación.
router
  .route("/:id/notifications")
  .patch(clientController.updateNotifications);

// El cliente gestiona sus métodos de pago (datos no sensibles).
router
  .route("/:id/payment-methods")
  .patch(clientController.updatePaymentMethods);

export default router;