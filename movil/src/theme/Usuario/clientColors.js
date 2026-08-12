/*
 * ============================================================
 * PALETA DEL ÁREA DE CLIENTE ("Mi Cuenta") — clientColors.js
 * ============================================================
 * Es EXACTAMENTE la misma paleta que usa la web en
 * `frontend/src/hooks/useClientTheme.js` (`clientColors`). Se copia valor por
 * valor a propósito: el objetivo es que "Mi Cuenta" en el teléfono se vea
 * idéntico a la web —los mismos marrones cálidos, las mismas tarjetas blancas
 * con borde gris— y no que "se parezca".
 *
 * Si algún día la web cambia un color de esta paleta, este archivo es el que
 * hay que igualar.
 * ============================================================
 */
export const clientColors = {
  primary: '#8B5A2B',        // el café de la marca (botones, precios, activo)
  primaryHover: '#5a3a1a',   // su versión oscura (degradados)
  primaryLight: '#f5ede4',   // fondo tenue de cuadros de icono / avatar
  accent: '#a06a35',         // acento cálido (puntos, degradado de fidelidad)
  buttonText: '#ffffff',     // el texto sobre el café

  // Fondos blancos, igual que la tienda: el contenido se distingue por su
  // borde, no por el color del fondo.
  mainBg: '#ffffff',
  topbarBg: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: '#ebebeb',
  sidebarBorder: '#ebebeb',

  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#9ca3af',
};

/*
 * Colores de ESTADO (semánticos). En la web viven como hex sueltos dentro de
 * MisPedidos/Recibidos/Reparto y NO cambian con la paleta, para que un
 * "Entregado" siempre se lea verde. Se juntan aquí para no repetirlos.
 */
export const estadoColores = {
  pagado:     { color: '#2563eb', bg: 'rgba(37,99,235,.12)' },
  preparando: { color: '#d97706', bg: 'rgba(217,119,6,.14)' },
  entregado:  { color: '#16a34a', bg: 'rgba(22,163,74,.14)' },
  cancelado:  { color: '#dc2626', bg: 'rgba(220,38,38,.12)' },
  peligro:    '#dc2626',   // el rojo de los botones de eliminar
  exito:      '#16a34a',
  estrella:   '#f5a623',   // el amarillo de las estrellas de valoración
};

/*
 * TOKENS DE MEDIDA — la traducción de las clases de Tailwind de la web a
 * números de React Native, para que los redondeos y espacios queden iguales.
 *   rounded-xl → 12   ·   rounded-2xl → 16   ·   rounded-full → 999
 *   p-4 → 16   ·   p-5 → 20   ·   p-6 → 24   ·   text-2xl → 24 (títulos)
 */
export const ui = {
  radius: { md: 8, lg: 12, xl: 16, full: 999 },
  // font-weight de Tailwind
  weight: { medium: '500', semibold: '600', bold: '700', extrabold: '800' },
  // tamaños de texto usados en las pantallas del cliente
  size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xxl: 24, huge: 30 },
};

export default clientColors;
