import express from "express";
import clientController from "../controller/Clients/clientController.js";
import upload from "../utils/cloudinaryConfig.js";
import { soloAdmin, duenoOPersonal } from "../middlewares/validarSesion.js";

const router = express.Router();

/*
 * Todo este router estaba abierto. Con el id en la URL —que se adivina o se
 * copia— cualquiera leía y EDITABA la cuenta de otro: sus direcciones con
 * coordenadas, sus métodos de pago, sus favoritos.
 *
 * `duenoOPersonal("id")` es la regla general aquí: el cliente solo con lo
 * suyo, el personal con lo de todos porque atender es su trabajo.
 */

/*
 * La lista de todos los clientes: cosa del personal. Misma razón que
 * /registerClient/all, que es la gemela que usa el panel.
 */
router
  .route("/")
  .get(soloAdmin, clientController.getClients);

/*
 * Borrar una cuenta es irreversible y hasta hace poco estaba abierto: con un
 * curl y un _id cualquiera podía borrar a un cliente de la tienda.
 */
router
  .route("/:id")
  .get(duenoOPersonal("id"), clientController.getClientById)
  .put(duenoOPersonal("id"), upload.single("image"), clientController.updateClient)
  .delete(soloAdmin, clientController.deleteClient);

// El cliente edita su propio perfil (datos básicos, JSON).
router
  .route("/:id/profile")
  .patch(duenoOPersonal("id"), clientController.updateClientProfile);

// Los productos que el cliente marcó con el corazón.
router
  .route("/:id/favorites")
  .get(duenoOPersonal("id"), clientController.getFavorites)
  .patch(duenoOPersonal("id"), clientController.toggleFavorite);

// El cliente gestiona su lista de direcciones de entrega.
router
  .route("/:id/addresses")
  .patch(duenoOPersonal("id"), clientController.updateAddresses);

// El cliente actualiza sus preferencias de notificación.
router
  .route("/:id/notifications")
  .patch(duenoOPersonal("id"), clientController.updateNotifications);

// El cliente gestiona sus métodos de pago (datos no sensibles).
router
  .route("/:id/payment-methods")
  .patch(duenoOPersonal("id"), clientController.updatePaymentMethods);

export default router;
