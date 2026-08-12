/*
 * ============================================================
 * PROMOCIONES — promos.js
 * ============================================================
 * Puerto de `frontend/src/utils/promos.js`. Helpers de presentación de una
 * promo (sello, vencimiento, vigencia). JS puro; la única adaptación es que
 * `textoVencimiento` no usa toLocaleDateString('es') —poco fiable en Hermes—
 * sino nombres de mes escritos a mano.
 * ============================================================
 */

const numero = (v) => Number(v) || 0;

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// El sello del ahorro que va en la tarjeta: "-25%", "$1.25" o "2x1".
export const etiquetaPromo = (promo) => {
  if (!promo) return '';
  const items = Array.isArray(promo.items) ? promo.items : [];

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
  const descuentos = items.map((it) => numero(it.discount)).filter((n) => n > 0);
  if (!descuentos.length) return 'Oferta';
  return `-${Math.max(...descuentos)}%`;
};

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
  return `Termina el ${fin.getDate()} de ${MESES_LARGO[fin.getMonth()]}`;
};

// Los ids de producto que toca una promo (poblados o como id suelto).
export const idsDePromo = (promo) =>
  (promo?.items || [])
    .map((it) => (typeof it.productId === 'object' ? it.productId?._id : it.productId))
    .filter(Boolean);

// Las que de verdad se anuncian: vigentes, marcadas para banner y con título/imagen.
export const promosVisibles = (lista) =>
  (Array.isArray(lista) ? lista : []).filter(
    (p) => promoVigente(p) && p.showBanner !== false && (p.image || p.title)
  );
