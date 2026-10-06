import { useSyncExternalStore } from 'react';
import { URL_WEB_LEGAL } from './legales';

/*
 * ============================================================
 * ENLACES QUE ABREN LA APP — enlaces.js
 * ============================================================
 * Un producto compartido es un enlace de la web: /producto/:id (ver
 * frontend/src/utils/compartir.js). Si quien lo toca tiene la app, Android
 * se lo puede pasar a ella en vez de al navegador (los intentFilters de
 * app.json), y aquí se reconoce. También el esquema propio de la app,
 * tiendala635://producto/:id, que sirve para probar y para los avisos.
 *
 * El producto pedido se guarda en `pendiente` hasta que la tienda esté lista
 * para abrirlo: el enlace puede llegar con la app recién abierta, antes de
 * que exista el catálogo o la pantalla de inicio.
 * ============================================================
 */

const WEB = URL_WEB_LEGAL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const RE_PRODUCTO = new RegExp(
  `^(?:tiendala635://|https?://${WEB.replace(/\./g, '\\.')}/)producto/([a-f0-9]{24})\\b`,
  'i'
);

export const idDeProductoEnEnlace = (url) => String(url || '').match(RE_PRODUCTO)?.[1] || null;

let pendiente = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((fn) => fn());

export const pedirProducto = (id) => { pendiente = id; avisar(); };
export const soltarProductoPedido = () => { pendiente = null; avisar(); };

export const useProductoPedido = () =>
  useSyncExternalStore(
    (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    () => pendiente
  );
