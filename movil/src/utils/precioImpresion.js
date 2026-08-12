/*
 * ============================================================
 * PRECIO DE UNA IMPRESIÓN — precioImpresion.js
 * ============================================================
 * Puerto EXACTO de `frontend/src/utils/precioImpresion.js`. Se cobra por HOJA
 * (no por página): a doble cara caben 2 páginas por hoja, por eso sale más
 * barato. Cada hoja cuesta el precio del formato + el recargo de color si
 * aplica, todo por la cantidad de copias. El precio que vale es el del backend;
 * aquí solo se muestra antes de enviar.
 * ============================================================
 */

export const hojasNecesarias = (paginas, dobleCara) => {
  const n = Math.max(1, Number(paginas) || 1);
  return dobleCara ? Math.ceil(n / 2) : n;
};

export const calcularPrecioImpresion = ({ servicio, paginas = 1, copias = 1, color = false, dobleCara = false }) => {
  if (!servicio) return { hojas: 0, precioPorHoja: 0, total: 0 };

  const cobraColor = color && servicio.allowsColor;
  const precioPorHoja =
    (Number(servicio.pricePerCopy) || 0) + (cobraColor ? Number(servicio.colorSurcharge) || 0 : 0);

  const hojas = hojasNecesarias(paginas, dobleCara);
  const nCopias = Math.max(1, Number(copias) || 1);

  return {
    hojas,
    precioPorHoja: Number(precioPorHoja.toFixed(2)),
    total: Number((precioPorHoja * hojas * nCopias).toFixed(2)),
  };
};
