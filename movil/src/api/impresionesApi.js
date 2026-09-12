/*
 * ============================================================
 * IMPRESIONES — impresionesApi.js
 * ============================================================
 * Los mismos tres endpoints que usa la web para el pasillo de Impresiones:
 *
 *   GET  /printService   catálogo de formatos (Carta, A4, DUI...) con precio
 *   GET  /printMaterial  el papel y la tinta, para saber qué hay disponible
 *   POST /order/print    crear el pedido de impresión (lleva archivo)
 *
 * No hay CRUD de formatos ni de materiales aquí: eso lo administra el panel
 * (ServiciosImpresion.jsx / MaterialesImpresion.jsx en la web), no la app del
 * cliente.
 * ============================================================
 */

import { peticion } from './api';

export const getFormatosImpresion = () => peticion('/printService');

export const getMaterialesImpresion = () => peticion('/printMaterial');

/*
 * `datos` ya viene armado como FormData (con el archivo adentro) — ver
 * Impresiones.js. `peticion()` reconoce un FormData y lo manda tal cual, sin
 * forzarle un Content-Type: JSON (igual que ya hace Register.js con la foto
 * de perfil).
 */
export const crearPedidoImpresion = (datosFormulario) =>
  peticion('/order/print', { metodo: 'POST', cuerpo: datosFormulario });
