/*
 * ============================================================
 * TARIFA DE SERVICIO — servicio.js
 * ============================================================
 * El MISMO cálculo que hace el backend al crear el pedido, para que el carrito
 * muestre lo que se va a cobrar. Apagada = 0. Fija = dólares. Porcentaje = % del
 * subtotal (los productos, sin envío).
 * ============================================================
 */
export const calcularServicio = (ajustes = {}, subtotal = 0) => {
  if (!ajustes.servicioActivo) return 0;
  const valor = Number(ajustes.servicioValor) || 0;
  if (ajustes.servicioTipo === 'porcentaje') {
    return Number(((Number(subtotal) || 0) * valor / 100).toFixed(2));
  }
  return Number(valor.toFixed(2));
};
