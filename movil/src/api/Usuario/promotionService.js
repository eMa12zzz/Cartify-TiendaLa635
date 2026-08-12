/*
 * ============================================================
 * SERVICIO DE PROMOCIONES — promotionService.js
 * ============================================================
 * Puerto de `frontend/src/api/promotionService.js` (solo la lectura). La tienda
 * lo usa para pintar los banners y aplicar descuentos/2x1. Endpoint intacto
 * (/promotion); transporte por `peticion()`.
 * ============================================================
 */
import { peticion } from '../api';

export const promotionService = {
  getPromotions: () => peticion('/promotion'),
};

export default promotionService;
