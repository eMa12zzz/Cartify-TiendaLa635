/*
 * ============================================================
 * PROMOCIONES — promos.js
 * ============================================================
 * Helpers de presentación de una promo. Viven aparte porque los usan tanto
 * la tienda (carrusel) como el admin (vista previa), y así el empleado ve
 * exactamente lo mismo que va a ver el cliente.
 * ============================================================
 */

const numero = (v) => Number(v) || 0;

/*
 * El sello del ahorro que va en la tarjeta: "-25%", "$1.25" o "2x1".
 * Ojo: el descuento vive en cada item, NO a nivel de promo — antes se leía
 * promo.discount y salía "-undefined%".
 */
export const etiquetaPromo = (promo) => {
  if (!promo) return '';
  const items = Array.isArray(promo.items) ? promo.items : [];

  if (promo.type === 'nxm') {
    return `${numero(promo.buyQty) || 2}x${numero(promo.payQty) || 1}`;
  }

  if (promo.type === 'precio_fijo') {
    const precios = items.map((it) => numero(it.fixedPrice)).filter((n) => n > 0);
    if (!precios.length) return 'Oferta';
    return `$${Math.min(...precios).toFixed(2)}`;
  }

  // Descuento: mostramos el mayor, que es el gancho.
  const descuentos = items.map((it) => numero(it.discount)).filter((n) => n > 0);
  if (!descuentos.length) return 'Oferta';
  return `-${Math.max(...descuentos)}%`;
};

/*
 * Las que de verdad se anuncian en la tienda: activas y marcadas para anunciar.
 * Ya NO se exige imagen — la tarjeta se dibuja con el texto y los colores del
 * tema. Lo que sí hace falta es un título: sin él el banner saldría vacío.
 */
export const promosVisibles = (lista) =>
  (Array.isArray(lista) ? lista : []).filter(
    (p) => p.isActive !== false && p.showBanner !== false && (p.image || p.title)
  );
