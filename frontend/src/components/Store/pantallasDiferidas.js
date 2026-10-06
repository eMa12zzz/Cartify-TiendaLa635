import { lazy } from 'react';

/*
 * ============================================================
 * LO QUE SE ABRE ENCIMA DE LA TIENDA — pantallasDiferidas.js
 * ============================================================
 * El carrito, Tiqui, la ficha de un producto y el detalle de una promo solo
 * se ven cuando alguien los abre, pero venían en el mismo archivo que la
 * portada: había que bajarlos (con el generador de QR del kiosco incluido)
 * antes de ver el primer producto.
 *
 * Ahora se descargan aparte. Para que abrirlos siga siendo instantáneo, la
 * tienda los pide en cuanto termina de pintarse, en un rato libre del
 * navegador (precargarPantallas): cuando la persona toca el carrito, ya
 * están. Si lo toca antes, se espera un instante sin que se mueva nada.
 *
 * Quien los use los pinta dentro de <Suspense fallback={null}>: sin un
 * Suspense propio, el que atrapa la espera es el de App.jsx, que tapa la
 * tienda entera con la pantalla de carga.
 * ============================================================
 */
const cargar = {
  carrito: () => import('./ShoppingCart'),
  asistente: () => import('./AsistenteVoz'),
  ficha: () => import('./ProductDetailModal'),
  promo: () => import('./PromoDetailModal'),
};

export const ShoppingCart = lazy(cargar.carrito);
export const AsistenteVoz = lazy(cargar.asistente);
export const ProductDetailModal = lazy(cargar.ficha);
export const PromoDetailModal = lazy(cargar.promo);

let pedidas = false;

export const precargarPantallas = () => {
  if (pedidas) return;
  pedidas = true;
  const pedir = () =>
    Object.values(cargar).forEach((importar) =>
      // Si falla (se cortó la red), se vuelve a intentar la próxima vez.
      importar().catch(() => { pedidas = false; })
    );
  // Safari no tiene requestIdleCallback: ahí se espera un poco y listo.
  if ('requestIdleCallback' in window) window.requestIdleCallback(pedir, { timeout: 4000 });
  else setTimeout(pedir, 2500);
};
