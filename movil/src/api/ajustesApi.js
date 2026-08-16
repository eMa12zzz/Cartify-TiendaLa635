/*
 * ============================================================
 * AJUSTES DE LA TIENDA — ajustesApi.js
 * ============================================================
 * Un solo documento en el backend con el nombre de la tienda, su logo, el
 * orden de la portada y el tema de temporada. El equivalente de
 * `storeSettingsService.getAjustes` en la web.
 *
 * Solo se lee. Guardarlos es cosa del panel de Personalización, que no existe
 * en móvil — y no debería: repintar la tienda de todos los clientes desde un
 * teléfono no es una función que se quiera a un toque de distancia.
 * ============================================================
 */

import { peticion } from './api';

export const getAjustes = () => peticion('/storeSettings');

export default getAjustes;
