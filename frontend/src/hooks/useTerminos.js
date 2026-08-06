import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useVolver } from './useVolver';
import { useAjustesCtx } from '../context/AjustesContext';
import { enlaceWhatsApp } from '../utils/tienda';
import {
  SECCIONES,
  TABLA_DATOS,
  VERSION_TERMINOS,
  FECHA_TERMINOS,
  MENSAJE_BORRADO,
} from '../utils/terminos';

/*
 * ============================================================
 * useTerminos — todo lo que necesita la pantalla de términos
 * ============================================================
 * La pantalla solo pinta. Aquí se resuelven las tres cosas que no son texto
 * quieto:
 *
 *   1. El nombre y la dirección salen de los ajustes de la tienda, no
 *      escritos a mano. Un documento legal que sigue diciendo "Tienda la 635"
 *      después de que el dueño le cambió el nombre al negocio es un documento
 *      que ya no habla de nadie.
 *   2. El índice se arma solo con los títulos de las secciones: agregar una
 *      sección al texto la pone en el índice sin tocar esta pantalla.
 *   3. El enlace para pedir el borrado va con el mensaje YA escrito, y con el
 *      correo puesto si hay sesión. Quien llega hasta aquí queriendo ejercer
 *      ese derecho no debería tener que redactar nada.
 * ============================================================
 */

export const useTerminos = () => {
  const { user } = useAuth();
  const { ajustes } = useAjustesCtx();
  // Sin historial —alguien que abrió el enlace directo o llegó en pestaña
  // nueva desde el registro— "volver" es ir a la tienda.
  const { volver } = useVolver('/');

  const nombre = `${ajustes.nombreLinea1} ${ajustes.nombreLinea2}`.trim();

  /*
   * El índice de la izquierda. Se deriva del documento en vez de escribirse
   * aparte: dos listas que hay que acordarse de mantener iguales terminan
   * distintas siempre.
   */
  const indice = useMemo(
    () => SECCIONES.map(({ id, titulo }) => ({ id, titulo })),
    []
  );

  /*
   * Saltar a una sección sin cambiar la dirección del navegador.
   *
   * Con un ancla de toda la vida (#datos), el botón "atrás" se llena de
   * paradas intermedias: quien tocó cuatro secciones tiene que apretar atrás
   * cuatro veces para salir del documento.
   *
   * Y va SIN `behavior: 'smooth'`, aunque el deslizamiento se vería mejor.
   * Motivo: donde el navegador tiene apagadas las animaciones de scroll, esa
   * opción no se degrada a un salto seco — se descarta entera y el botón deja
   * de hacer absolutamente nada. Se probó y se vio: `scrollIntoView()` a secas
   * llevaba al título y con `behavior: 'smooth'` la página no se movía ni un
   * píxel. En un índice, llegar sin animación es infinitamente mejor que no
   * llegar. El respiro bajo el encabezado pegajoso lo pone `scroll-margin-top`
   * en el título, no este código.
   */
  const irASeccion = (id) => {
    const destino = document.getElementById(id);
    if (destino) destino.scrollIntoView({ block: 'start' });
  };

  const correo = user?.email || '';
  const whatsappBorrado = enlaceWhatsApp(`${MENSAJE_BORRADO}${correo}`);

  return {
    secciones: SECCIONES,
    tablaDatos: TABLA_DATOS,
    indice,
    irASeccion,
    volver,
    nombre,
    direccion: ajustes.direccion,
    version: VERSION_TERMINOS,
    fecha: FECHA_TERMINOS,
    // Sin número de WhatsApp configurado esto queda en null y la pantalla
    // ofrece el otro camino en vez de un botón que no lleva a ningún lado.
    whatsappBorrado,
  };
};
