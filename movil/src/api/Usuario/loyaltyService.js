/*
 * ============================================================
 * SERVICIO DE LOYALTY — loyaltyService.js
 * ============================================================
 * Puerto de `frontend/src/api/loyaltyService.js`. La lectura la usa el cliente
 * para su tarjeta de puntos; la edición de la config es solo del admin (no se
 * porta aquí). Transporte por `peticion()`, endpoints intactos.
 * ============================================================
 */
import { peticion } from '../api';

export const loyaltyService = {
  // Config actual del programa (tasa por dólar + meses de vencimiento).
  getConfig: () => peticion('/loyaltyConfig'),

  // Resumen de puntos del cliente: saldo disponible + próximos vencimientos.
  getSummary: (clientId) => peticion(`/loyalty/${clientId}/summary`),
};

export default loyaltyService;
