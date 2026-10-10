/*
 * ============================================================
 * EL PANEL WEB EN LA APP — lo que se decide por la dirección (panelWeb.js)
 * ============================================================
 * pages/personal/PanelWeb.js abre el panel de la web dentro de la app. Lo
 * único que la app mira del panel es a qué dirección va: con eso sabe si la
 * sesión venció, si alguien la cerró o si un enlace tiene que abrirse fuera.
 *
 * Sin `new URL()`: el de React Native no trae `pathname` ni `searchParams`.
 * ============================================================
 */

export const origenDeUrl = (url) => ((/^https?:\/\/[^/?#]+/i.exec(url || '') || [''])[0]).toLowerCase();

const rutaDeUrl = (url) => (/^https?:\/\/[^/?#]+([^?#]*)/i.exec(url || '') || [])[1] || '/';

const parametroDe = (url, nombre) => {
  const m = new RegExp(`[?&]${nombre}=([^&#]*)`).exec(url || '');
  if (!m) return null;
  try {
    return decodeURIComponent(m[1].replace(/\+/g, ' '));
  } catch {
    return null;
  }
};

// La dirección con la que se abre el panel: el pase y, si hace falta, a dónde volver.
export const direccionConPase = (web, pase, volver) =>
  `${web}/admin/desde-app?pase=${encodeURIComponent(pase)}${volver ? `&volver=${encodeURIComponent(volver)}` : ''}`;

/*
 * Qué quiere decir que el panel se vaya a su login (/admin):
 *   { accion: 'vencio', volver }  la sesión venció a medio trabajo y el panel
 *                                 manda al login con ?volver=: otro pase y de
 *                                 vuelta a donde iba;
 *   { accion: 'cerro' }           alguien tocó "Cerrar sesión" en el panel.
 * Cualquier otra pantalla: null.
 */
export const queHacerCon = (url, web) => {
  if (origenDeUrl(url) !== origenDeUrl(web)) return null;
  if (rutaDeUrl(url).replace(/\/+$/, '') !== '/admin') return null;
  const volver = parametroDe(url, 'volver');
  return volver && volver.startsWith('/') ? { accion: 'vencio', volver } : { accion: 'cerro' };
};

// Lo que no es del panel (WhatsApp, correo, teléfono, mapas) se abre fuera de la app.
export const esDelPanel = (url, web) =>
  /^(about:|blob:|data:)/i.test(url || '') || origenDeUrl(url) === origenDeUrl(web);
