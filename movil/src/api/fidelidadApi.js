/*
 * ============================================================
 * PUNTOS DE FIDELIDAD — fidelidadApi.js
 * ============================================================
 * Los dos endpoints que la web junta en `useLoyalty`:
 *
 *   GET /loyalty/:clienteId/summary   saldo disponible y vencimientos
 *   GET /loyaltyConfig                la tasa y los meses de vencimiento
 *
 * ── Por qué son dos y no uno ──
 *
 * El resumen es de UNA persona; la configuración es de la tienda y es igual
 * para todos. Y el saldo del resumen no es el `loyaltyPoints` del cliente: sale
 * del ledger, contando solo los lotes que todavía no vencen. Es la diferencia
 * entre "cuántos puntos ganó en su vida" y "cuántos puede usar hoy", y lo
 * segundo es lo único que se le puede prometer a alguien en la caja.
 *
 * La configuración se pide aunque no haya sesión: sin ella no se puede escribir
 * "cada 100 puntos son $1" sin inventarse el número.
 * ============================================================
 */

import { peticion } from './api';

export const getResumenPuntos = (clienteId) => peticion(`/loyalty/${clienteId}/summary`);

export const getConfigFidelidad = () => peticion('/loyaltyConfig');
