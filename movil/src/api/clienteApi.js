/*
 * ============================================================
 * LA CUENTA DEL CLIENTE — clienteApi.js
 * ============================================================
 * El equivalente de `frontend/src/api/clientService.js`: lo que un cliente hace
 * sobre SU propia cuenta. Los mismos cuatro endpoints que usa la web:
 *
 *   GET   /client/:id                  el cliente entero
 *   PATCH /client/:id/profile          nombre, usuario, correo, teléfono
 *   PATCH /client/:id/addresses        reemplaza la lista de direcciones
 *   PATCH /client/:id/notifications    los interruptores de avisos
 *
 * ── Uno solo trae casi todo ──
 *
 * `GET /client/:id` devuelve el cliente completo: sus datos, `clientAddress` y
 * `notificationPrefs`. En la web eso lo llaman por separado tres hooks, y cada
 * pantalla del área de cuenta vuelve a pedir el mismo documento. Aquí también
 * se pide una vez por pantalla y no se comparte: son pantallas que se abren de
 * a una, y un contexto para cachear un documento que se lee tres veces en toda
 * la vida de la app es más código del que ahorra.
 *
 * Los favoritos tienen su propio archivo (favoritosApi.js) porque ya existían
 * antes que esta pantalla: el corazón de las tarjetas los necesita en toda la
 * tienda, no solo en la cuenta.
 * ============================================================
 */

import { peticion } from './api';

export const getCliente = (clienteId) => peticion(`/client/${clienteId}`);

export const actualizarPerfil = (clienteId, campos) =>
  peticion(`/client/${clienteId}/profile`, { metodo: 'PATCH', cuerpo: campos });

/*
 * Manda la lista COMPLETA, no la que cambió. Es como está hecho el endpoint —
 * reemplaza el arreglo entero— así que borrar una dirección es mandar todas
 * menos esa.
 */
export const actualizarDirecciones = (clienteId, direcciones) =>
  peticion(`/client/${clienteId}/addresses`, {
    metodo: 'PATCH',
    cuerpo: { addresses: direcciones },
  });

// Aquí sí van solo las que cambiaron: el controlador las mezcla con las que ya
// estaban guardadas.
export const actualizarNotificaciones = (clienteId, preferencias) =>
  peticion(`/client/${clienteId}/notifications`, { metodo: 'PATCH', cuerpo: preferencias });
