/*
 * ============================================================
 * CÓMO ES LA PANTALLA — useDisposicion.js
 * ============================================================
 * Teléfono o tablet, parado o acostado, y de ahí cuántas columnas caben.
 * Se recalcula solo al girar el aparato (useWindowDimensions), a diferencia de
 * Dimensions.get(), que se queda con la medida del arranque.
 *
 *   esTablet   el lado corto mide 600 o más (la frontera que usa Android)
 *   columnas   cuántas tarjetas de producto caben por fila: 2 en el teléfono,
 *              3 o 4 en una tablet parada, hasta 5 acostada (ver
 *              utils/disposicion.js)
 *   anchoCelda el ancho de cada una de esas tarjetas
 *   escala     cuánto agrandar a Tiqui (y lo que se mide con ella): en una
 *              tablet la del teléfono se veía diminuta
 *
 * Los topes de ancho que no dependen del aparato están en theme/pantalla.js.
 * ============================================================
 */

import { useWindowDimensions } from 'react-native';
import { LADO_TABLET, anchoDeCelda, columnasPara } from '../utils/disposicion';

export const useDisposicion = () => {
  const { width, height } = useWindowDimensions();
  const esTablet = Math.min(width, height) >= LADO_TABLET;
  const columnas = columnasPara(width, esTablet);
  return {
    ancho: width,
    alto: height,
    esTablet,
    acostado: width > height,
    columnas,
    anchoCelda: anchoDeCelda(width, columnas),
    escala: esTablet ? 1.45 : 1,
  };
};

export default useDisposicion;
