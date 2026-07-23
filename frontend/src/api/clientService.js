import api from './api';

/*
 * ============================================================
 * SERVICIO DEL CLIENTE (área "Mi Cuenta") — clientService.js
 * ============================================================
 * Peticiones del cliente sobre SU propia cuenta (perfil, puntos).
 * Distinto de customerService.js, que es la vista del ADMIN sobre
 * todos los clientes.
 * ============================================================
 */
export const clientService = {
  // Traer un cliente por id (incluye loyaltyPoints; sin la contraseña).
  getClientById: async (id) => {
    const response = await api.get(`/client/${id}`);
    return response.data;
  },

  // El cliente actualiza SUS datos básicos (nombre, usuario, correo, teléfono).
  updateProfile: async (id, data) => {
    const response = await api.patch(`/client/${id}/profile`, data);
    return response.data;
  },

  // El cliente reemplaza su lista de direcciones (arreglo de strings).
  updateAddresses: async (id, addresses) => {
    const response = await api.patch(`/client/${id}/addresses`, { addresses });
    return response.data;
  },

  // El cliente actualiza sus preferencias de notificación.
  updateNotifications: async (id, prefs) => {
    const response = await api.patch(`/client/${id}/notifications`, prefs);
    return response.data;
  },

  // El cliente reemplaza su lista de métodos de pago (datos no sensibles).
  updatePaymentMethods: async (id, paymentMethods) => {
    const response = await api.patch(`/client/${id}/payment-methods`, { paymentMethods });
    return response.data;
  },
};
