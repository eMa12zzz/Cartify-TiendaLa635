/*
 * ============================================================
 * MODO CLARO / OSCURO — modo.js
 * ============================================================
 * Lo que elige cada persona en Mi Cuenta → Preferencias. Vive en este
 * navegador (localStorage), no en la cuenta: se tiene que poder aplicar
 * ANTES de que cargue nada, incluso sin sesión, y cada aparato tiene su luz
 * (el teléfono de noche, la compu de la oficina).
 *
 *   'claro'   — como siempre (el de fábrica).
 *   'oscuro'  — fondo oscuro en la tienda y Mi Cuenta.
 *   'sistema' — el que tenga puesto el teléfono o la computadora, y cambia
 *               solo cuando ese cambia.
 *
 * El script de index.html repite esta misma lógica en pocas líneas para
 * pintar el primer cuadro sin parpadeo. Si cambia la llave o los valores,
 * cambian los dos lados.
 * ============================================================
 */

export const LLAVE_MODO = 'la635_modo';

export const MODOS = ['claro', 'oscuro', 'sistema'];

export const leerModoGuardado = () => {
  try {
    const guardado = localStorage.getItem(LLAVE_MODO);
    return MODOS.includes(guardado) ? guardado : 'claro';
  } catch {
    return 'claro';
  }
};

export const guardarModo = (modo) => {
  try {
    localStorage.setItem(LLAVE_MODO, modo);
  } catch {
    // Sin almacenamiento (navegación privada estricta): se aplica igual,
    // solo que no se recuerda en la próxima visita.
  }
};

export const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

export const sistemaEnOscuro = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.(CONSULTA_OSCURO).matches;

export const esOscuro = (modo, sistemaOscuro = sistemaEnOscuro()) =>
  modo === 'oscuro' || (modo === 'sistema' && sistemaOscuro);

// Pone o quita el modo en el <html>. Los colores los resuelve index.css.
export const aplicarModo = (oscuro) => {
  const raiz = document.documentElement;
  if (oscuro) raiz.setAttribute('data-modo', 'oscuro');
  else raiz.removeAttribute('data-modo');
};
