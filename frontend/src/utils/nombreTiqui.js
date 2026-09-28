/*
 * ============================================================
 * TIQUI Y EL NOMBRE DEL CLIENTE — nombreTiqui.js
 * ============================================================
 * Con la sesión iniciada, Tiqui a veces llama a la persona por su nombre:
 * "¡Listo, María! Te agregué dos manzanas." A veces, no siempre: el nombre en
 * cada frase suena a vendedor por teléfono, y se gasta.
 *
 * SOLO EN LO QUE SE VE. NUNCA EN LO QUE SE ESCUCHA NI EN LA MEMORIA.
 * La política de privacidad promete que la IA (Gemini) y la voz (ElevenLabs)
 * reciben lo que se habla "sin su nombre, correo ni dirección". Por eso el
 * nombre se pone aquí, en el navegador, sobre la burbuja del chat: la voz
 * dice la frase sin él, y la memoria que viaja a la IA con la siguiente
 * pregunta la guarda sin él. Si algún día se quiere que Tiqui lo DIGA en voz
 * alta, primero hay que cambiar la política y subir su versión.
 *
 * La app tiene la misma pieza en movil/src/utils/nombreTiqui.js: si cambia
 * una, cambia la otra.
 * ============================================================
 */

// "MARÍA José Pérez" → "María". Vacío si no parece un nombre (un correo, un número).
export const primerNombre = (completo) => {
  const primero = String(completo || '').trim().split(/\s+/)[0] || '';
  if (!/^[\p{L}'-]{2,20}$/u.test(primero)) return '';
  return primero.charAt(0).toLocaleUpperCase('es') + primero.slice(1).toLocaleLowerCase('es');
};

/*
 * Dónde cabe el nombre sin forzar la frase. Si no hay un lugar natural, no se
 * pone: mejor sin nombre que "María, 2 Coca-Cola agregadas".
 *   "¡Listo! Te agregué…"   → "¡Listo, María! Te agregué…"
 *   "…¿Te lo agrego?"       → "…¿Te lo agrego, María?"
 * No se usan palabras que dependan de si es hombre o mujer ("bienvenida"): el
 * nombre no dice eso.
 */
export const ponerNombre = (texto, nombre) => {
  const t = String(texto || '');
  if (!nombre || !t || t.includes(nombre)) return null;
  const exclamacion = t.match(/^¡([^!¡?,]{1,24})!/);
  if (exclamacion) return t.replace(exclamacion[0], `¡${exclamacion[1]}, ${nombre}!`);
  if (/[\p{L}\d)]\?$/u.test(t)) return t.replace(/\?$/, `, ${nombre}?`);
  return null;
};

/*
 * Cuándo. La primera respuesta de la charla, algo más de la mitad de las
 * veces (hace de saludo); después, más o menos una de cada tres, y nunca en
 * dos respuestas seguidas ni en dos de tres.
 *
 * `estado` es un objeto que el asistente guarda en una ref durante la charla:
 * { respuestas, ultimaConNombre }. `azar` se puede cambiar para probar.
 */
export const conNombreAVeces = (texto, nombre, estado, azar = Math.random) => {
  estado.respuestas = (estado.respuestas || 0) + 1;
  if (!nombre) return texto;
  const n = estado.respuestas;
  const desdeLaUltima = n - (estado.ultimaConNombre ?? -Infinity);
  const toca = n === 1 ? azar() < 0.6 : desdeLaUltima >= 3 && azar() < 0.35;
  if (!toca) return texto;
  const conNombre = ponerNombre(texto, nombre);
  if (!conNombre) return texto;
  estado.ultimaConNombre = n;
  return conNombre;
};
