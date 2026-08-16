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

export default ALTURA_ESTADO;
