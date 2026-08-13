/*
 * ============================================================
 * TARJETAS DE REGALO Y SALDO — giftCardApi.js
 * ============================================================
 * Las dos rutas que le tocan al CLIENTE de `giftCardService` en la web:
 *
 *   GET  /giftCard/balance/:clienteId   cuánto saldo tiene
 *   POST /giftCard/redeem               canjea un código y devuelve el saldo nuevo
 *
 * Las otras dos del servicio de la web (crear y anular tarjetas) son del panel
 * de administración y no tienen nada que hacer en la app del cliente.
 *
 * ── El saldo NUNCA se calcula aquí ──
 *
 * Siempre viene del servidor, hasta después de canjear: la respuesta del canje
 * trae el saldo ya sumado y ese es el que manda. Llevar la cuenta en el
 * teléfono —saldo viejo + lo que valía la tarjeta— es dinero calculado en un
 * aparato que el cliente tiene en la mano.
 * ============================================================
 */

import { peticion } from './api';

export const getSaldo = (clienteId) => peticion(`/giftCard/balance/${clienteId}`);

export const canjearTarjeta = (codigo, clienteId) =>
  peticion('/giftCard/redeem', {
    metodo: 'POST',
    cuerpo: { code: codigo, clientId: clienteId },
  });
