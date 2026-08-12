/*
 * ============================================================
 * CÓMO SE VENDE CADA PRODUCTO — unidades.js
 * ============================================================
 * Puerto EXACTO de `frontend/src/utils/unidades.js`. Es JS puro (sin DOM), así
 * que se copia tal cual: la regla de "por unidad vs por libra" tiene que dar el
 * mismo resultado en el panel, la tienda, el carrito y el recibo.
 * ============================================================
 */

export const UNIDADES = [
  {
    clave: 'unidad', nombre: 'Por unidad',
    descripcion: 'Piezas sueltas: una botella, un paquete, una bolsa.',
    existencia: 'Unidades', corto: 'u', fraccionable: false, paso: 1,
  },
  {
    clave: 'libra', nombre: 'Por libra',
    descripcion: 'A granel y por peso: verduras, quesos, granos básicos.',
    existencia: 'Libras', corto: 'lb', fraccionable: true, paso: 0.5,
  },
];

const POR_DEFECTO = UNIDADES[0];

// Todo lo que no diga expresamente "libra" es por unidad.
export const unidadDe = (producto) =>
  UNIDADES.find((u) => u.clave === producto?.unidadVenta) || POR_DEFECTO;

export const esPorLibra = (producto) => unidadDe(producto).clave === 'libra';

// El precio, escrito como se cobra: "$1.25" vs "$1.25/lb".
export const precioConUnidad = (producto, precio) => {
  const monto = `$${Number(precio ?? producto?.salePrice ?? 0).toFixed(2)}`;
  return esPorLibra(producto) ? `${monto}/lb` : monto;
};

// Una cantidad con su unidad: "3 u" o "3.5 lb".
export const cantidadConUnidad = (producto, cantidad) => {
  const n = Number(cantidad) || 0;
  const u = unidadDe(producto);
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');
  return `${texto} ${u.corto}`;
};

export const pasoDe = (producto) => unidadDe(producto).paso;

// Qué dice el campo `piezas` según cómo se venda el producto.
export const piezasEnTexto = (producto) => {
  const n = Number(producto?.piezas);
  if (!Number.isFinite(n) || n <= 0) return null;
  return esPorLibra(producto)
    ? `${n} ${n === 1 ? 'pieza' : 'piezas'}`
    : `Trae ${n} ${n === 1 ? 'unidad' : 'unidades'}`;
};

export const esSoloAdultos = (producto) => !!producto?.soloAdultos;

// Redondea al paso de su unidad (evita el 1.1000000000000001 de coma flotante).
export const ajustarCantidad = (producto, cantidad) => {
  const paso = pasoDe(producto);
  const n = Math.max(0, Number(cantidad) || 0);
  return Math.round(n / paso) * paso;
};
