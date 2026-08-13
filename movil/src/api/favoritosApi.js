/*
 * ============================================================
 * FAVORITOS — favoritosApi.js
 * ============================================================
 * Los dos endpoints del corazón, los mismos que usa `clientService` en la web:
 *
 *   GET   /client/:id/favorites   la lista completa
 *   PATCH /client/:id/favorites   marca o desmarca uno (manda { productId })
 *
 * El PATCH es un interruptor, no un "agregar": el servidor mira si ya estaba y
 * hace lo contrario. Por eso no hay un DELETE aparte.
 * ============================================================
 */

import { peticion } from './api';

export const getFavoritos = (clienteId) => peticion(`/client/${clienteId}/favorites`);

export const alternarFavorito = (clienteId, productoId) =>
  peticion(`/client/${clienteId}/favorites`, {
    metodo: 'PATCH',
    cuerpo: { productId: productoId },
  });
