/*
 * ============================================================
 * PÍXELES ↔ CENTÍMETROS — pxImpresion.js
 * ============================================================
 * Puerto de `frontend/src/utils/pxImpresion.js`. El formato se guarda en
 * centímetros (lo que necesita el papel de verdad), pero se MUESTRA en
 * píxeles —lo que se conoce, como una foto— con la misma densidad (300 DPI)
 * que usa la web. Solo se necesita la mitad de conversión: mobile no
 * administra el catálogo, solo lo lee.
 * ============================================================
 */
const DPI_IMPRESION = 300;
const CM_POR_PULGADA = 2.54;

export const pxDesdeCm = (cm) => Math.round((Number(cm) || 0) / CM_POR_PULGADA * DPI_IMPRESION);
