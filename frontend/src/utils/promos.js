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

  /*
   * El anuncio no tiene ahorro que mostrar: su sello es una palabra que la
   * tienda escribe ("Nuevo", "De la casa"). Sin esto saldría "-0%", que es
   * peor que no poner nada.
   */
  if (promo.type === 'anuncio') {
    return (promo.etiqueta || '').trim() || 'Nuevo';
  }

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
 * ── Vencimiento ──
 * El backend apaga las promos vencidas cuando alguien pide la lista, pero la
 * tienda no puede depender de eso: alguien con la página abierta desde ayer
 * seguiría viendo la promo de ayer. Por eso la fecha se mira también acá, en
 * cada render — es la verdad más barata y la más inmediata.
 */

// Medianoche de hoy: comparar días completos, no horas.
const hoyCero = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const fechaFin = (promo) => {
  if (!promo?.endsAt) return null;
  const f = new Date(promo.endsAt);
  return isNaN(f.getTime()) ? null : f;
};

export const promoVencida = (promo) => {
  const fin = fechaFin(promo);
  return !!fin && fin.getTime() < Date.now();
};

// Una promo rige si está activa y todavía no se le pasó la fecha.
export const promoVigente = (promo) =>
  !!promo && promo.isActive !== false && !promoVencida(promo);

/*
 * Cuánto le queda, dicho como lo diría una persona. "Termina el 3 de agosto"
 * sirve para planear; "Último día" es lo que hace que alguien compre hoy.
 */
export const textoVencimiento = (promo) => {
  const fin = fechaFin(promo);
  if (!fin) return null;
  if (promoVencida(promo)) return 'Vencida';

  const finDia = new Date(fin);
  finDia.setHours(0, 0, 0, 0);
  const dias = Math.round((finDia - hoyCero()) / 86400000);

  if (dias <= 0) return 'Último día';
  if (dias === 1) return 'Termina mañana';
  if (dias <= 6) return `Quedan ${dias} días`;

  return `Termina el ${fin.toLocaleDateString('es', { day: 'numeric', month: 'long' })}`;
};

/*
 * Las que de verdad se anuncian en la tienda: vigentes y marcadas para anunciar.
 * Ya NO se exige imagen — la tarjeta se dibuja con el texto y los colores del
 * tema. Lo que sí hace falta es un título: sin él el banner saldría vacío.
 */
export const promosVisibles = (lista) =>
  (Array.isArray(lista) ? lista : []).filter(
    (p) => promoVigente(p) && p.showBanner !== false && (p.image || p.title)
  );
