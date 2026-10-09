/*
 * ============================================================
 * EL ÁNIMO DE TIQUI — animoTiqui.js
 * ============================================================
 * La misma regla que frontend/src/utils/animoTiqui.js. Cada frase de Tiqui
 * lleva un ánimo (alegre, emocionada, asombrada, rie, apenada, dudosa o
 * normal) y con él suena su voz: el servidor lo vuelve una etiqueta de
 * ElevenLabs (backend/src/utils/vozTiqui.js).
 *
 * Lo que contesta la IA ya trae su ánimo. Las frases fijas de las reglas
 * rápidas no: el suyo sale de aquí, por cómo empiezan.
 * ============================================================
 */

export const animoDeFrase = (texto = '') => {
  if (/(Pasa a caja|Lleva tu carrito a caja|Te abro el pago)/.test(texto)) return 'emocionada'; // cerró la compra
  if (/^(Agregué|Te agregué|¡Listo|Listo)/.test(texto)) return 'alegre';
  if (/^(No te entendí|Perdón, se me cortó|Uy, me distraje)/.test(texto)) return 'dudosa';
  if (/^(No encontré|No tienes|No pude)/.test(texto)) return 'apenada';
  return 'normal';
};
