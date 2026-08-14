/*
 * useClientTheme — paleta FIJA del área de cliente ("Mi Cuenta"), que coincide
 * con la app web de clientes / tienda (marrones cálidos), no con las paletas de
 * accesibilidad del admin.
 *
 * Se expone con la misma forma que useTheme (palette.colors) para que las
 * páginas del cliente cambien SOLO el import y nada más de su código.
 */
export const clientColors = {
  /*
   * Los roles de MARCA salen de los tokens de la tienda (--marca-*), no de
   * hexes fijos. Así, cuando el dueño cambia el color de la tienda en el panel
   * (o cae una temporada), el área "Mi Cuenta" —incluida la pantalla de estado
   * del pedido— se pinta del mismo color, sin quedarse en el café viejo.
   * Las variables de CSS funcionan igual dentro de estilos en línea.
   */
  primary: 'var(--marca-600)',
  primaryHover: 'var(--marca-700)',
  primaryLight: 'var(--marca-100)',
  accent: 'var(--acento)',
  buttonText: '#ffffff',
  /*
   * Fondo blanco, igual que la tienda.
   *
   * El gris de antes venía de cuando la tienda también era beige; ahora que
   * la tienda es blanca, pasar de una a otra se sentía como cambiar de sitio
   * web. El contenido se sigue distinguiendo por su borde, no por el color
   * del fondo.
   */
  mainBg: '#ffffff',
  topbarBg: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: '#ebebeb',
  sidebarBorder: '#ebebeb',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#9ca3af',
};

export const useTheme = () => ({ palette: { colors: clientColors } });
