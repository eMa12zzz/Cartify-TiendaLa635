/*
 * ============================================================
 * SERVICIO DE FORMATOS DE IMPRESIÓN — printServiceService.js
 * ============================================================
 * Puerto de `frontend/src/api/printServiceService.js` (solo la lectura, que es
 * lo que usa el cliente). El catálogo de formatos (Carta, A4, DUI, Póster…) con
 * su precio. Endpoint intacto (/printService); transporte por `peticion()`.
 * ============================================================
 */
import { peticion } from '../api';

export const printServiceService = {
  getServices: () => peticion('/printService'),
};

export default printServiceService;
