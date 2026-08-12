/*
 * ============================================================
 * SERVICIO DE PRODUCTOS — productService.js
 * ============================================================
 * Puerto de `frontend/src/api/productService.js` (solo la lectura, que es lo
 * que usa la tienda del cliente). Endpoint intacto (/product); transporte por
 * `peticion()` de `../api.js`.
 * ============================================================
 */
import { peticion } from '../api';

export const productService = {
  // Todos los productos del catálogo.
  getProducts: () => peticion('/product'),
};

export default productService;
