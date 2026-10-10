/*
 * ============================================================
 * MEDIDAS DE LA PANTALLA — pantalla.js
 * ============================================================
 * Cuánto mide la barra de estado (la hora, la señal, la batería). Sin
 * reservarle ese espacio, lo primero de cada pantalla queda DEBAJO de la hora.
 *
 * Vive en un solo lugar porque ya se necesita en tres barras distintas —la de
 * la marca en el login, la de la tienda y la del carrito— y una constante
 * copiada tres veces es una constante que en la tercera sale distinta.
 *
 * En Android el sistema lo dice (`StatusBar.currentHeight`); el 24 es el
 * respaldo para cuando todavía no contestó. En iOS no hay API equivalente en
 * React Native pelado y 44 es la altura de la isla/notch en los modelos
 * actuales — el día que se instale react-native-safe-area-context, este archivo
 * es el único que cambia.
 * ============================================================
 */

import { Platform, StatusBar } from 'react-native';

export const ALTURA_ESTADO = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

/*
 * ── Tablets y pantallas anchas ──
 *
 * La app se pensó para el teléfono, y en una tablet (o un teléfono acostado)
 * todo salía estirado: un formulario de 1.200 px de ancho, la hoja del
 * producto de orilla a orilla, la barra de abajo atravesando la pantalla. Las
 * tablets Android nuevas además ignoran el "solo vertical" de app.json, así
 * que la app también se ve acostada.
 *
 * Estas medidas son TOPES: en el teléfono nunca se alcanzan y no cambia nada.
 *   ANCHO_LECTURA  lo que se lee o se llena (formularios, Mi cuenta, el carrito)
 *   ANCHO_HOJA     las hojas que suben desde abajo (el producto, la promo…)
 * Lo que se reparte en columnas (el catálogo) no se centra: usa más columnas
 * (ver hooks/useDisposicion.js).
 */
export const ANCHO_LECTURA = 720;
export const ANCHO_HOJA = 640;
export const ANCHO_BARRA_INFERIOR = 520;

// Para el contentContainerStyle de una página: el contenido centrado con su tope.
export const contenidoCentrado = { width: '100%', maxWidth: ANCHO_LECTURA, alignSelf: 'center' };
// Para el panel de una hoja que sube desde abajo.
export const hojaCentrada = { width: '100%', maxWidth: ANCHO_HOJA, alignSelf: 'center' };

export default ALTURA_ESTADO;
