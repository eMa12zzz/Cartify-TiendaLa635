/*
 * ============================================================
 * ALMACÉN — lo que sobrevive a cerrar la app
 * ============================================================
 * La web guarda la sesión y el carrito en localStorage. En React Native eso no
 * existe; su reemplazo aquí es expo-secure-store, que en Android va al
 * KeyStore y en iOS al Keychain.
 *
 * Este archivo existe para que ni AuthContext ni CarritoContext tengan que
 * saber nada de las tres asperezas de esa librería:
 *
 *   1. NO CORRE EN WEB. El proyecto tiene `npm run web` y ahí SecureStore
 *      simplemente no está. Sin esta capa, abrir la app en el navegador
 *      reventaba en el primer `getItemAsync`. Cuando no hay dónde guardar se
 *      usa un Map en memoria: se pierde al recargar, pero nada se cae.
 *
 *   2. LAS LLAVES NO ACEPTAN DOS PUNTOS. Solo alfanuméricos, punto, guion y
 *      guion bajo. La llave de la web —`kartify:carrito:${userId}`— es
 *      inválida tal cual, así que aquí se separa con puntos.
 *
 *   3. HAY UN TOPE DE TAMAÑO. El doc de Expo avisa que iOS ha rechazado
 *      valores de más de ~2048 bytes. Un carrito son pares {id, cantidad}, así
 *      que caben del orden de cuarenta líneas antes de acercarse — pero
 *      "del orden de" no es una garantía, y perder el carrito entero por una
 *      línea de más sería el peor final. Por eso `guardar` avisa si no pudo.
 * ============================================================
 */

import * as SecureStore from 'expo-secure-store';

/*
 * El respaldo para cuando no hay caja fuerte (web, o un dispositivo que la
 * niegue). Vive fuera de React a propósito: se comporta igual que SecureStore
 * —se lee y se escribe desde cualquier parte— solo que sin sobrevivir al cierre.
 */
const enMemoria = new Map();

/*
 * Se resuelve una sola vez y se recuerda. `isAvailableAsync` es una llamada al
 * lado nativo: preguntarlo en cada lectura del carrito sería pagar ese salto
 * por cada toque al "+".
 */
let disponible = null;

const hayCajaFuerte = async () => {
  if (disponible !== null) return disponible;
  try {
    disponible = await SecureStore.isAvailableAsync();
  } catch {
    // En web el módulo nativo ni siquiera existe y esto lanza.
    disponible = false;
  }
  return disponible;
};

/*
 * Arma una llave válida. Se recibe en piezas y no como texto ya armado para
 * que no haya manera de colar un carácter prohibido desde el que llama: el
 * error de SecureStore por una llave inválida es "Invalid key provided", que
 * no dice cuál ni por qué.
 */
export const llave = (...piezas) =>
  piezas
    .filter((p) => p !== null && p !== undefined && p !== '')
    .map((p) => String(p).replace(/[^A-Za-z0-9._-]/g, '_'))
    .join('.');

export const leer = async (nombre) => {
  if (!(await hayCajaFuerte())) return enMemoria.get(nombre) ?? null;
  try {
    return await SecureStore.getItemAsync(nombre);
  } catch {
    /*
     * Un valor ilegible (la app se reinstaló, el KeyStore se rotó) no es un
     * error que valga la pena propagar: es lo mismo que no haber guardado nada.
     */
    return null;
  }
};

/*
 * Devuelve si de verdad quedó guardado. Quien llama decide qué hacer con esa
 * respuesta — el carrito, por ejemplo, sigue funcionando en pantalla aunque no
 * se haya podido escribir; lo único que pierde es la memoria entre sesiones.
 */
export const guardar = async (nombre, valor) => {
  if (!(await hayCajaFuerte())) {
    enMemoria.set(nombre, valor);
    return true;
  }
  try {
    await SecureStore.setItemAsync(nombre, valor);
    return true;
  } catch {
    return false;
  }
};

export const borrar = async (nombre) => {
  if (!(await hayCajaFuerte())) {
    enMemoria.delete(nombre);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(nombre);
  } catch {
    /* Borrar lo que no está es exactamente el resultado que se buscaba. */
  }
};
