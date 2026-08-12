/*
 * ============================================================
 * SERVICIO DEL CLIENTE (área "Mi Cuenta") — clientService.js
 * ============================================================
 * Puerto de `frontend/src/api/clientService.js`. MISMOS endpoints del backend
 * (/client/...), MISMOS nombres de método. Lo único que cambia es el transporte:
 * la web usa axios (`api.get(...).data`), y aquí se usa `peticion()` de
 * `../api.js`, que ya trae el `fetch` configurado contra el backend real y
 * devuelve el JSON ya parseado. La conexión a la base NO se toca.
 *
 * Peticiones del cliente sobre SU propia cuenta (perfil, favoritos, direcciones,
 * notificaciones, métodos de pago). Distinto de la vista del ADMIN.
 * ============================================================
 */
import { peticion, URL_API } from '../api';

export const clientService = {
  // Traer un cliente por id (incluye loyaltyPoints; sin la contraseña).
  getClientById: (id) => peticion(`/client/${id}`),

  // El cliente actualiza SUS datos básicos (nombre, usuario, correo, teléfono).
  updateProfile: (id, data) =>
    peticion(`/client/${id}/profile`, { metodo: 'PATCH', cuerpo: data }),

  /*
   * El cliente sube/reemplaza su foto de perfil. Va por el endpoint multipart
   * (PUT /client/:id), que exige también nombre, teléfono, correo y usuario.
   *
   * `peticion` está pensado para JSON, así que aquí NO se usa: un multipart
   * necesita que el navegador/RN ponga el boundary del Content-Type solo. Por
   * eso se hace un fetch directo contra la MISMA URL_API (sin tocar api.js).
   *
   * En React Native, `formData` recibe la imagen como { uri, name, type }.
   */
  actualizarConFoto: async (id, formData) => {
    const res = await fetch(`${URL_API}/client/${id}`, {
      method: 'PUT',
      headers: { Accept: 'application/json' }, // el Content-Type lo pone FormData
      body: formData,
    });
    const datos = await res.json().catch(() => null);
    if (!res.ok) throw new Error(datos?.message || 'No se pudo subir la foto');
    return datos;
  },

  // Favoritos del cliente (el corazón de las tarjetas de producto).
  getFavorites: (id) => peticion(`/client/${id}/favorites`),

  toggleFavorite: (id, productId) =>
    peticion(`/client/${id}/favorites`, { metodo: 'PATCH', cuerpo: { productId } }),

  // El cliente reemplaza su lista completa de direcciones.
  updateAddresses: (id, addresses) =>
    peticion(`/client/${id}/addresses`, { metodo: 'PATCH', cuerpo: { addresses } }),

  // El cliente actualiza sus preferencias de notificación.
  updateNotifications: (id, prefs) =>
    peticion(`/client/${id}/notifications`, { metodo: 'PATCH', cuerpo: prefs }),

  // El cliente reemplaza su lista de métodos de pago (datos no sensibles).
  updatePaymentMethods: (id, paymentMethods) =>
    peticion(`/client/${id}/payment-methods`, { metodo: 'PATCH', cuerpo: { paymentMethods } }),
};

export default clientService;
