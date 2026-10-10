/*
 * ============================================================
 * LA PALETA DEL PANEL EN LA APP — paletaPanel.js
 * ============================================================
 * El panel de la web tiene sus paletas (Lectura, Contraste reforzado, Modo
 * oscuro, Calma, Calma noche; ver frontend/src/context/ThemeContext.jsx).
 * Cuando el administrador elige una en el panel abierto dentro de la app
 * (pages/personal/PanelWeb.js), el panel se lo avisa a la app y el modo del
 * personal ENTERO se pinta con ella: la barra de arriba, Tiqui, el Reparto, los
 * avisos. La tienda no: es la de los clientes y sigue con sus colores.
 *
 * Aquí se traducen los colores del panel a los nombres de la paleta de la app
 * (theme/colores.js). "Mi marca" es la de siempre: no cambia nada.
 * ============================================================
 */

import { COLORES_CLARO, COLORES_OSCURO } from '../theme/colores';

// Un color que se puede pintar: #RGB, #RRGGBB(AA) o rgb()/rgba().
const ES_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\))$/i;
const CLAVES = [
  'primary', 'primaryHover', 'primaryLight', 'accent', 'accentText', 'buttonText', 'sidebarBg',
  'sidebarBorder', 'mainBg', 'cardBg', 'cardBorder', 'textPrimary', 'textSecondary', 'textMuted',
  'peligro', 'aviso', 'exito',
];

/*
 * { id, oscuro, colores } tal como lo manda el panel →
 * { id, clave, colores (la paleta de la app), marca (la de TemaContext) },
 * o null si es "Mi marca" o si llegó algo que no se puede pintar.
 */
export const paletaDesdePanel = (datos) => {
  if (!datos || typeof datos !== 'object' || datos.id === 'marca') return null;
  const id = String(datos.id || '');
  if (!/^[a-z0-9-]{1,30}$/.test(id)) return null;
  const c = datos.colores || {};
  if (!CLAVES.every((k) => ES_COLOR.test(String(c[k] || '')))) return null;

  const oscuro = datos.oscuro === true;
  const base = oscuro ? COLORES_OSCURO : COLORES_CLARO;

  const colores = {
    ...base,
    oscuro,
    marca: c.primary,
    marcaOscuro: c.primaryHover,
    marcaSuave: c.primaryLight,
    marcaTexto: c.accentText,
    sobreMarca: c.buttonText,

    fondo: c.mainBg,
    papelAlto: c.cardBg,
    papelSuave: c.cardBg,
    papelGris: c.sidebarBg,
    banda: c.sidebarBorder,

    texto: c.textPrimary,
    tituloFuerte: c.textPrimary,
    tituloVentaja: c.textPrimary,
    tinta: c.textPrimary,
    textoSuave: c.textSecondary,
    textoVentaja: c.textSecondary,
    subtitulo: c.textSecondary,
    tintaSuave: c.textSecondary,
    textoTenue: c.textMuted,
    tintaTenue: c.textMuted,
    // Lo que va encima de un botón color tinta: el fondo de la paleta.
    sobreTinta: c.cardBg,

    linea: c.cardBorder,
    lineaCard: c.cardBorder,
    borde: c.cardBorder,

    error: c.peligro,
    peligro: c.peligro,
    alertaTexto: c.peligro,
    avisoTexto: c.aviso,
    exitoTexto: c.exito,
  };

  return {
    id,
    clave: `panel-${id}`,
    colores,
    marca: {
      marca: c.primary,
      marcaOscuro: c.primaryHover,
      marcaClaro: c.accent,
      marcaSuave: c.primaryLight,
      marcaTenue: c.primaryLight,
      acento: c.accent,
      marcaTexto: c.accentText,
    },
  };
};
