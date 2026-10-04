/*
 * ============================================================
 * CUÁNTO CUESTA CADA RENGLÓN DE UN PEDIDO — precioPedido.js
 * ============================================================
 * ⚠️  Esta cuenta está ESPEJADA en la tienda web y en la app:
 *
 *       frontend/src/hooks/useStore.js     construirMapaPromo y mapearProducto
 *       frontend/src/components/Store/ShoppingCart.jsx   precioEfectivo
 *       movil/src/utils/catalogo.js        construirMapaPromo, mapearProducto
 *                                          y totalDeLinea
 *
 *     Si cambia una regla aquí, hay que cambiarla allá también. Están
 *     duplicadas porque la tienda tiene que enseñar el precio antes de que
 *     exista el pedido, pero el que VALE es este: lo que se cobra lo decide
 *     el servidor.
 *
 * Por qué existe: antes el subtotal se sumaba con el `price` que mandaba el
 * navegador en cada renglón. El comentario de al lado decía que nunca
 * confiábamos en el total del front, y era verdad — confiábamos en algo
 * peor, en el precio por unidad. Cualquiera que abriera las herramientas del
 * navegador podía mandar `price: 0.01` y llevarse el queso a un centavo. El
 * stock ya se revisaba contra la base; el precio, que es lo que de verdad
 * se cobra, no.
 *
 * Ahora el precio sale del producto guardado (`salePrice`) con la promoción
 * que le toque en este momento, con las mismas reglas que ve el cliente:
 *
 *   descuento    → el precio con su % menos, redondeado a centavos.
 *   precio_fijo  → el precio de oferta, tal cual.
 *   nxm          → precio normal, pero de cada N se pagan M. Se guarda como
 *                  el total del renglón repartido entre las unidades, que es
 *                  como lo manda el carrito desde siempre: así `price ×
 *                  amount` sigue dando lo que se cobró, en el recibo y en
 *                  los reportes.
 *   anuncio      → no toca el precio.
 *
 * Todo lo de aquí es cuenta pura: no lee la base. El controlador trae los
 * productos y las promociones y le pasa lo que encontró.
 * ============================================================
 */

const numero = (v) => Number(v) || 0;

/*
 * ¿La promo rige ahora mismo? Encendida y sin la fecha pasada — la misma
 * regla que `promoVigente` de la tienda.
 *
 * No basta con el `isActive` de la base: las vencidas se apagan solas, pero
 * de forma perezosa, cuando alguien pide la lista de promociones (ver
 * desactivarVencidas en promotionController). Una que venció anoche puede
 * seguir encendida en la base hasta que alguien abra la tienda, y no puede
 * seguir bajando precios por eso.
 *
 * Una fecha ilegible cuenta como "sin vencimiento", igual que en la tienda:
 * si aquí se tomara como vencida, el cliente vería la oferta en pantalla y
 * se le cobraría el precio entero.
 */
export const promoVigente = (promo, ahora = new Date()) => {
  if (!promo || promo.isActive === false) return false;
  if (!promo.endsAt) return true;
  const fin = new Date(promo.endsAt);
  return isNaN(fin.getTime()) || fin.getTime() >= ahora.getTime();
};

/*
 * Un producto puede estar en VARIAS promos vigentes a la vez —un anuncio que
 * solo lo destaca y un descuento que sí le baja el precio—. Gana la que toca
 * el precio por encima del anuncio y, entre dos que lo tocan, la más nueva.
 * Es la regla de la tienda web; si aquí ganara otra, el cliente vería un
 * precio en pantalla y pagaría otro.
 */
const prioridadPromo = (tipo) => (tipo === "anuncio" ? 0 : 1);

/*
 * Mapa "id del producto" → la promo que le toca. Las promos pueden venir con
 * los productos poblados o como puro id; las dos sirven.
 */
export const construirMapaPromo = (promos, ahora = new Date()) => {
  const mapa = new Map();
  const ordenadas = (promos || [])
    .filter((p) => promoVigente(p, ahora))
    .sort((a, b) =>
      prioridadPromo(b.type) - prioridadPromo(a.type) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

  for (const pr of ordenadas) {
    for (const it of pr.items || []) {
      const pid = it?.productId?._id || it?.productId;
      if (!pid || mapa.has(String(pid))) continue;
      mapa.set(String(pid), {
        type: pr.type,
        discount: numero(it.discount),
        fixedPrice: it.fixedPrice,
        buyQty: pr.buyQty || 2,
        payQty: pr.payQty || 1,
      });
    }
  }
  return mapa;
};

/*
 * Precio de UNA unidad —o de una libra, si el producto se vende por peso—
 * con la promo aplicada.
 *
 * Hay dos diferencias con la tienda y las dos son a propósito: un descuento
 * de más del 100% y un precio fijo que no es un número. Los dos son errores
 * al cargar la promo, y en la tienda se verían como un precio negativo o
 * como "NaN". Aquí no pueden pasar a la cuenta: un renglón negativo le resta
 * a todo lo demás del pedido. El descuento se queda en cero y el precio fijo
 * ilegible se ignora.
 */
export const precioUnitario = (producto, promo) => {
  const base = numero(producto?.salePrice);

  if (promo?.type === "descuento" && promo.discount > 0) {
    return Math.max(0, Number((base * (1 - promo.discount / 100)).toFixed(2)));
  }

  if (promo?.type === "precio_fijo" && promo.fixedPrice != null && promo.fixedPrice !== "") {
    const fijo = Number(promo.fixedPrice);
    if (Number.isFinite(fijo) && fijo >= 0) return fijo;
  }

  return base;
};

/*
 * Cuántas unidades se pagan de las que se lleva. Sin NxM, todas.
 *
 * Con NxM funciona igual con libras: 2.5 lb en un 2x1 son un grupo completo
 * (paga 1) más la media libra suelta, que se paga entera — 1.5 lb. Es la
 * misma cuenta que hace el carrito, con decimales incluidos.
 *
 * Una promo mal armada (comprar 0, pagar más de las que se llevan) se trata
 * como si no existiera: cobrar el precio de lista es lo menos raro que se
 * puede hacer con ella.
 */
export const unidadesPagadas = (cantidad, promo) => {
  if (promo?.type !== "nxm") return cantidad;
  const compra = promo.buyQty || 2;
  const paga = promo.payQty || 1;
  if (!(compra > 0) || !(paga >= 0) || paga > compra) return cantidad;

  const grupos = Math.floor(cantidad / compra);
  return grupos * paga + (cantidad % compra);
};

/*
 * El `price` que se guarda en el renglón del pedido: lo que de verdad se paga
 * por cada unidad.
 *
 * En un NxM es el total del renglón entre las unidades, a cuatro decimales
 * —exactamente el precioEfectivo del carrito—, para que `price × amount` dé
 * lo mismo que el cliente vio en pantalla.
 */
export const precioDeRenglon = (producto, promo, cantidad) => {
  const unitario = precioUnitario(producto, promo);
  if (promo?.type !== "nxm") return unitario;
  return Number(((unitario * unidadesPagadas(cantidad, promo)) / cantidad).toFixed(4));
};
