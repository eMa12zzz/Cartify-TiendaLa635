/*
 * ============================================================
 * FECHAS EN ESPAÑOL — fecha.js
 * ============================================================
 * La web usa `new Date(iso).toLocaleDateString('es-SV', ...)`. En React Native
 * (motor Hermes) el soporte de Intl/locale no está garantizado, así que la
 * misma llamada podría salir en inglés o distinta en cada teléfono. Para que la
 * fecha se vea IGUAL que en la web, se formatea a mano con nombres en español.
 * ============================================================
 */

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dos = (n) => String(n).padStart(2, '0');

// "12 ago 2026" — equivale al { day:'2-digit', month:'short', year:'numeric' } de la web.
export const fechaCorta = (iso) => {
  if (!iso) return '';
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '';
  return `${dos(f.getDate())} ${MESES_CORTO[f.getMonth()]} ${f.getFullYear()}`;
};

// "12/08/2026" — equivale al { day:'2-digit', month:'2-digit', year:'numeric' }.
export const fechaNumerica = (iso) => {
  if (!iso) return '';
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '';
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()}`;
};

// "14:05" — la hora del día (para "Preparado a las …" en Reparto).
export const hora = (iso) => {
  if (!iso) return '';
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '';
  return `${dos(f.getHours())}:${dos(f.getMinutes())}`;
};
