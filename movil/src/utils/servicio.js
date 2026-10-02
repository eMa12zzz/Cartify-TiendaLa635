/*
 * ============================================================
 * TARIFA DE SERVICIO — servicio.js (app)
 * ============================================================
 * El MISMO cálculo que hace el backend al crear el pedido (y que la web repite
 * en frontend/src/utils/servicio.js), para que el pago muestre lo que se va a
 * cobrar. Apagada = 0. Fija = dólares. Porcentaje = % del subtotal (los
 * productos, sin envío). Se cobra igual a domicilio que a retiro.
 *
 * Antes la app no la sumaba: con la tarifa encendida en el panel, el total del
 * botón salía más bajo que el del pedido, y el saldo "alcanzaba" en pantalla
 * para luego rebotar en el servidor.
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
