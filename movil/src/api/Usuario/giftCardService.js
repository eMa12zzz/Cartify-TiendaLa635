/*
 * ============================================================
 * SERVICIO DE GIFT CARDS — giftCardService.js
 * ============================================================
 * Puerto de `frontend/src/api/giftCardService.js` (solo la parte del cliente:
 * consultar saldo y canjear un código). Transporte por `peticion()`.
 * ============================================================
 */
import { peticion } from '../api';

export const giftCardService = {
  // Canjear el código de una tarjeta y sumar su valor al saldo del cliente.
  redeem: (code, clientId) =>
    peticion('/giftCard/redeem', { metodo: 'POST', cuerpo: { code, clientId } }),

  // Saldo digital disponible del cliente.
  getBalance: (clientId) => peticion(`/giftCard/balance/${clientId}`),
};

export default giftCardService;
