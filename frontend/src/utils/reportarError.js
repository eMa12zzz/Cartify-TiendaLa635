/*
 * ============================================================
 * AVISAR QUE ALGO FALLÓ — reportarError.js
 * ============================================================
 * Manda el error al servidor (POST /api/errores), que lo agrupa, lo muestra
 * en el panel (Sistema → Errores) y le avisa por correo al administrador.
 * Ver backend/src/utils/registroErrores.js.
 *
 * Reglas, para que avisar nunca estorbe:
 *   - Solo en la tienda publicada: en desarrollo la consola ya lo dice.
 *   - Cada error, una vez por visita, y como mucho 10 en total: una pantalla
 *     que falla en bucle no inunda nada.
 *   - Sin conexión no se intenta: el error es la red, no la tienda.
 *   - Va como texto plano y sin cookies: es una petición "simple" que no
 *     necesita permiso previo del servidor, así que sale aunque la página
 *     se esté cerrando (keepalive). No lleva datos de la persona.
 * ============================================================
 */

const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const MAXIMO_POR_VISITA = 10;
const enviados = new Set();

export const reportarError = (error, { donde, extra } = {}) => {
  try {
    if (!import.meta.env.PROD || !navigator.onLine) return;
    const mensaje = String(error?.message || error || '').slice(0, 500);
    if (!mensaje) return;
    const lugar = donde || window.location.pathname;
    const clave = `${mensaje}|${lugar}`;
    if (enviados.has(clave) || enviados.size >= MAXIMO_POR_VISITA) return;
    enviados.add(clave);

    const pila = [String(error?.stack || ''), extra ? String(extra) : ''].filter(Boolean).join('\n').slice(0, 4000);
    fetch(`${API}/errores`, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        origen: 'web',
        mensaje,
        pila,
        donde: lugar,
        version: import.meta.env.VITE_VERSION || '',
        dispositivo: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch {
    // Avisar de un error jamás puede causar otro.
  }
};

/*
 * Lo que se escapa de todo (fuera de React, o una promesa que nadie esperaba).
 * Se ignora lo que no es de la tienda: extensiones del navegador y scripts
 * de otros sitios ("Script error." sin detalle), y las peticiones al servidor
 * que fallaron por algo del cliente (4xx): esas ya se le explican a la
 * persona en pantalla y no son una falla.
 */
export const escucharErroresSueltos = () => {
  window.addEventListener('error', (evento) => {
    const archivo = evento.filename || '';
    if (archivo && !archivo.startsWith(window.location.origin)) return;
    if (!evento.error && /^Script error\.?$/i.test(evento.message || '')) return;
    if (/ResizeObserver loop/i.test(evento.message || '')) return;
    reportarError(evento.error || evento.message);
  });
  window.addEventListener('unhandledrejection', (evento) => {
    const motivo = evento.reason;
    const estado = motivo?.response?.status;
    if (motivo?.isAxiosError && (!estado || estado < 500)) return;
    reportarError(motivo);
  });
};
