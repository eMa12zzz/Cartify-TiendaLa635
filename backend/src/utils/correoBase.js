/*
 * ============================================================
 * EL ESQUELETO DE LOS CORREOS — correoBase.js
 * ============================================================
 * Lo que comparten todos los correos de la tienda: la armadura contra el modo
 * oscuro, la identidad de arriba y el pie.
 *
 * POR QUÉ EXISTE LA ARMADURA
 * Gmail en el teléfono, con el tema oscuro puesto, NO respeta los colores del
 * correo: los invierte. El encabezado azul marino salía celeste con letra
 * negra, el botón igual, y la tarjeta blanca se volvía gris carbón. El correo
 * se veía como el negativo de sí mismo.
 *
 * No hay una sola bandera que lo apague, así que van tres capas:
 *
 *   1. `color-scheme: light` — le dice al cliente "este correo ya está
 *      diseñado, no lo adaptes". Lo respetan Apple Mail y Outlook.
 *   2. `@media (prefers-color-scheme: dark)` — para los que sí leen el media
 *      query, se vuelven a fijar los colores con !important.
 *   3. `[data-ogsc]` y `[data-ogsb]` — el truco de Gmail. Cuando la app de
 *      Gmail invierte un correo, le cuelga esos atributos al marcado; son el
 *      único gancho que existe para volver a poner el color a mano.
 *
 * Ninguna de las tres funciona en todos lados, y por eso van las tres. Lo que
 * sí es seguro: los estilos EN LÍNEA se quedan como respaldo, así que en el
 * peor de los casos el correo se ve como antes y no roto.
 *
 * POR QUÉ LOS COLORES NO SON LOS DE LA MARCA A SECAS
 * El azul de la tienda (#003049) es casi negro. Sobre el fondo oscuro de Gmail
 * desaparece. Por eso el encabezado del correo usa el azul y el TEXTO va
 * blanco forzado: es la combinación que sobrevive a las dos versiones.
 * ============================================================
 */

import { config } from "../../config.js";

export const AZUL = "#003049";
export const AZUL_OSCURO = "#00283D";

export const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

/*
 * Escapar lo que escribió una persona en el panel antes de meterlo en el HTML.
 * Un "<" suelto en el nombre de un producto rompe el correo entero.
 */
export const limpio = (texto = "") =>
  String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/*
 * El bloque de estilos del <head>. Va con clases y no con selectores de
 * etiqueta porque Gmail descarta las reglas que no entiende, y una clase es lo
 * más simple que existe.
 */
export const ESTILOS = `
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }

    /* Los clientes que respetan el media query */
    @media (prefers-color-scheme: dark) {
      .fondo      { background-color: #f5f5f5 !important; }
      .tarjeta    { background-color: #ffffff !important; }
      .cabecera   { background-color: ${AZUL} !important; }
      .sobre-color, .sobre-color a { color: #ffffff !important; }
      .texto      { color: #555555 !important; }
      .titulo     { color: #1C1614 !important; }
      .tenue      { color: #9C9691 !important; }
      .pie        { background-color: #f9f9f9 !important; }
      .boton      { background-color: ${AZUL} !important; }
      .boton a    { color: #ffffff !important; }
    }

    /* El gancho de la app de Gmail cuando invierte por su cuenta */
    [data-ogsc] .fondo      { background-color: #f5f5f5 !important; }
    [data-ogsc] .tarjeta    { background-color: #ffffff !important; }
    [data-ogsc] .cabecera   { background-color: ${AZUL} !important; }
    [data-ogsc] .sobre-color, [data-ogsc] .sobre-color a { color: #ffffff !important; }
    [data-ogsc] .texto      { color: #555555 !important; }
    [data-ogsc] .titulo     { color: #1C1614 !important; }
    [data-ogsc] .tenue      { color: #9C9691 !important; }
    [data-ogsc] .pie        { background-color: #f9f9f9 !important; }
    [data-ogsc] .boton      { background-color: ${AZUL} !important; }
    [data-ogsc] .boton a    { color: #ffffff !important; }

    [data-ogsb] .tarjeta    { background-color: #ffffff !important; }
    [data-ogsb] .cabecera   { background-color: ${AZUL} !important; }
    [data-ogsb] .pie        { background-color: #f9f9f9 !important; }
    [data-ogsb] .boton      { background-color: ${AZUL} !important; }
  </style>`;

/*
 * QUIÉN MANDA ESTE CORREO. Va arriba del todo, antes del asunto de adentro.
 *
 * Faltaba: los correos llegaban con un titular ("Llegaron 3 cosas nuevas") y
 * nada que dijera de qué tienda. Quien recibe cinco correos al día no tiene
 * por qué adivinar cuál de sus tiendas le escribe.
 *
 * Si el dueño cargó un logo en Personalización, manda el logo. Si no, el
 * nombre en dos renglones, igual que en el encabezado de la tienda. Nunca las
 * dos cosas: sería decir el nombre dos veces.
 */
export const identidad = ({ nombreLinea1, nombreLinea2, logoUrl }) => {
  if (logoUrl) {
    return `<img src="${limpio(logoUrl)}" alt="${limpio(`${nombreLinea1} ${nombreLinea2}`.trim())}"
              height="40" style="display:block;margin:0 auto 14px;max-height:40px;width:auto;border:0;" />`;
  }
  return `
    <p class="sobre-color" style="margin:0 0 14px;font-size:15px;font-weight:800;line-height:1.15;color:#ffffff;letter-spacing:0.2px;">
      ${limpio(nombreLinea1)}${nombreLinea2 ? `<br />${limpio(nombreLinea2)}` : ''}
    </p>`;
};

/*
 * El pie. `enlaceBaja` es la dirección de UN clic que apaga ese aviso; si no
 * viene, no se pinta la línea — el aviso de que su pedido va en camino no es
 * publicidad y no lleva salida. Ver plantillasAviso.js.
 */
export const pie = ({ nombreTienda, enlaceBaja, motivo }) => `
  <tr>
    <td class="pie" style="background:#f9f9f9;padding:22px 40px;border-top:1px solid #eeeeee;text-align:center;">
      ${enlaceBaja
        ? `<p class="tenue" style="margin:0 0 8px;font-size:12px;color:#9C9691;line-height:1.6;">
             ${limpio(motivo || 'Le llega este correo porque pidió que le avisáramos.')}<br />
             <a href="${enlaceBaja}" style="color:#6B6560;">Dejar de recibirlos</a>
           </p>`
        : ''}
      <p class="tenue" style="margin:0;font-size:12px;color:#bbbbbb;">© ${new Date().getFullYear()} ${limpio(nombreTienda)}</p>
    </td>
  </tr>`;

/*
 * El botón. En su propia tabla porque Outlook ignora el padding de un <a>
 * suelto y lo deja del tamaño exacto del texto.
 */
export const boton = ({ texto, url, color = AZUL }) => `
  <table cellpadding="0" cellspacing="0" align="center">
    <tr><td class="boton" style="background:${color};border-radius:10px;">
      <a href="${url}" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${limpio(texto)}</a>
    </td></tr>
  </table>`;

/* La dirección de la tienda vista desde afuera, sin barra al final. */
export const urlTienda = () => config.tienda.url;
