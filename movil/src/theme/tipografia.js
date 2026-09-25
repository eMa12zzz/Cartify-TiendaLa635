/*
 * LA LETRA DE LA MARCA — "Tienda la 635"
 *
 * Poppins ExtraBold (800), la misma que usa la web para el nombre de la
 * tienda. Antes la app le pedía grosor 800 a la letra del sistema (Roboto),
 * que en Android se queda en una negrita común: el nombre se veía más delgado
 * que en la web.
 *
 * Va incrustada en la app (plugin "expo-font" en app.json), así que está
 * lista desde el primer cuadro, sin parpadeo. En Android una letra
 * incrustada se pide por el nombre de su archivo, y como ese archivo ya ES
 * el grosor 800, no se le pone fontWeight: pedirle negrita encima la
 * engrosaría de más.
 */
export const FUENTE_MARCA = 'Poppins_800ExtraBold';
