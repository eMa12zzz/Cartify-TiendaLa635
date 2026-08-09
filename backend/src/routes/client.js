import express from "express";
import clientController from "../controller/Clients/clientController.js";
import upload from "../utils/cloudinaryConfig.js";
import { soloPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

/*
 * La lista de todos los clientes: cosa del personal. Misma razón que
 * /registerClient/all, que es la gemela que usa el panel.
 */
router
  .route("/")
  .get(soloPersonal, clientController.getClients);

/*
 * Borrar una cuenta es irreversible y hasta hoy estaba abierto: con un curl y
 * un _id cualquiera podía borrar a un cliente de la tienda. Queda para el
 * personal.
 *
 * Las otras dos siguen sin candado por ahora, y es a conciencia: el área "Mi
 * Cuenta" las usa a cada rato y ponerles el portero equivocado deja al cliente
 * fuera de su propia cuenta. Van en la segunda pasada, con el backend
 * encendido para probarlas — igual que los seis PATCH de más abajo, que
 * también deberían exigir que el id de la URL sea el de quien pregunta.
 */
router
  .route("/:id")
  .get(clientController.getClientById)
  .put(upload.single("image"), clientController.updateClient)
  .delete(soloPersonal, clientController.deleteClient);

// El cliente edita su propio perfil (datos básicos, JSON).
router
  .route("/:id/profile")
  .patch(clientController.updateClientProfile);

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