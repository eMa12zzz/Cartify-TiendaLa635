import { LLAVE_CONSENTIMIENTO_COOKIES } from './legales/cookies';
import { VERSION_LEGAL } from './legales';

/*
 * ============================================================
 * EL CONSENTIMIENTO DE COOKIES — consentimiento.js
 * ============================================================
 * Qué eligió la persona en el aviso de cookies. Hoy hay una sola categoría
 * opcional: las analíticas (Vercel Web Analytics). Lo necesario —la sesión,
 * el carrito— no se pregunta: sin eso la tienda no funciona, y la política de
 * cookies lo explica.
 *
 * Vive en localStorage y NO en un estado de React porque lo leen tres
 * lugares que no se conocen: el aviso, el pie ("Configurar cookies") y las
 * analíticas, que lo vuelven a mirar ANTES DE CADA ENVÍO para que retirar el
 * permiso surta efecto en el acto, sin recargar.
 *
 * Dura 12 meses: después se vuelve a preguntar, que es lo razonable para un
 * permiso que la persona dio una vez y pudo olvidar.
 * ============================================================
 */

const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;
const EVENTO_CAMBIO = 'la635:consentimiento';
const EVENTO_ABRIR = 'la635:configurar-cookies';

let cache = null;
let crudoCache = undefined;

export const leerConsentimiento = () => {
  let crudo;
  try { crudo = localStorage.getItem(LLAVE_CONSENTIMIENTO_COOKIES); } catch { crudo = null; }
  // Mismo texto guardado = mismo objeto: useSyncExternalStore lo exige para
  // no entrar en un ciclo de renders.
  if (crudo === crudoCache) return cache;
  crudoCache = crudo;
  try {
    const c = JSON.parse(crudo);
    cache = c && Date.now() - c.fecha < VIGENCIA_MS ? c : null;
  } catch {
    cache = null;
  }
  return cache;
};

export const guardarConsentimiento = (analiticas) => {
  const valor = { analiticas: !!analiticas, fecha: Date.now(), version: VERSION_LEGAL };
  try { localStorage.setItem(LLAVE_CONSENTIMIENTO_COOKIES, JSON.stringify(valor)); } catch { /* modo privado: vale para esta visita */ }
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
};

export const suscribirConsentimiento = (avisar) => {
  const alCambiarOtraPestana = (e) => { if (e.key === null || e.key === LLAVE_CONSENTIMIENTO_COOKIES) avisar(); };
  window.addEventListener(EVENTO_CAMBIO, avisar);
  window.addEventListener('storage', alCambiarOtraPestana);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, avisar);
    window.removeEventListener('storage', alCambiarOtraPestana);
  };
};

// "Configurar cookies" del pie: vuelve a abrir el aviso para cambiar lo elegido.
export const abrirAvisoCookies = () => window.dispatchEvent(new Event(EVENTO_ABRIR));

export const alPedirConfigurar = (fn) => {
  window.addEventListener(EVENTO_ABRIR, fn);
  return () => window.removeEventListener(EVENTO_ABRIR, fn);
};

export const aceptoAnaliticas = () => !!leerConsentimiento()?.analiticas;
