/*
 * ============================================================
 * EL BOTÓN DE ATRÁS DE ANDROID — useBotonAtras.js
 * ============================================================
 * En Android, el botón de atrás del sistema cierra la app si nadie lo atiende.
 * Cuando hay una hoja abierta —el detalle de un producto, el de una promo— lo
 * que la gente espera es que cierre ESA hoja, no que la saque de la tienda.
 *
 * El `Modal` de React Native trae esto resuelto con `onRequestClose`, y era la
 * razón principal para usarlo. Se dejó de usar por otra: Modal se dibuja en
 * una capa nativa POR ENCIMA de todo el árbol, incluido el aviso de "agregado
 * al carrito". Agregar algo desde el detalle de una promoción no mostraba
 * nada, y un toque que no contesta se vuelve a tocar tres veces.
 *
 * Así que las hojas pasaron a ser vistas normales dentro del árbol —donde el
 * aviso sí puede quedar encima— y esto devuelve lo único que se perdió.
 *
 * En iOS no hay botón de atrás: `BackHandler` simplemente no dispara, y el
 * gesto de cerrar es tocar fuera o la equis.
 * ============================================================
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const useBotonAtras = (alPresionar, activo = true) => {
  useEffect(() => {
    if (!activo) return;

    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      alPresionar();
      // `true` = "yo me encargo": sin esto, además de cerrar la hoja, Android
      // seguiría su camino y cerraría también la pantalla de atrás.
      return true;
    });

    return () => suscripcion.remove();
  }, [alPresionar, activo]);
};

export default useBotonAtras;
