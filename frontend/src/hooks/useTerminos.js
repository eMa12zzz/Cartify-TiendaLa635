import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useVolver } from './useVolver';
import { useAjustesCtx } from '../context/AjustesContext';
import { enlaceWhatsApp } from '../utils/tienda';
import { documentoLegal, VERSION_LEGAL, FECHA_LEGAL, MENSAJE_BORRADO, DOCUMENTOS_LEGALES } from '../utils/legales';

/*
 * ============================================================
 * useDocumentoLegal — todo lo que necesita una página legal
 * ============================================================
 * Sirve para los cuatro documentos (términos, privacidad, cookies y
 * devoluciones). La pantalla solo pinta; aquí se resuelve lo que no es texto
 * quieto:
 *
 *   1. El nombre, la dirección y los DATOS DEL NEGOCIO salen de los ajustes
 *      de la tienda (Personalización), no escritos a mano. Un documento legal
 *      que sigue diciendo el nombre viejo ya no habla de nadie.
 *   2. El índice se arma solo con los títulos de las secciones.
 *   3. El enlace para pedir el borrado va con el mensaje YA escrito, y con el
 *      correo puesto si hay sesión.
 * ============================================================
 */

export const useDocumentoLegal = (clave = 'terminos') => {
  const { user } = useAuth();
  const { ajustes } = useAjustesCtx();
  // Sin historial —alguien que abrió el enlace directo— "volver" es ir a la tienda.
  const { volver } = useVolver('/');

  const documento = documentoLegal(clave);
  const nombre = `${ajustes.nombreLinea1} ${ajustes.nombreLinea2}`.trim();
  const negocio = ajustes.negocio || {};

  const indice = useMemo(
    () => documento.secciones.map(({ id, titulo }) => ({ id, titulo })),
    [documento]
  );

  /*
   * Saltar a una sección sin cambiar la dirección del navegador (con un ancla
   * el botón "atrás" se llena de paradas), y SIN `behavior: 'smooth'`: donde
   * el navegador tiene apagadas las animaciones, esa opción se descarta entera
   * y el botón deja de hacer nada. Llegar sin animación es mejor que no llegar.
   */
  const irASeccion = (id) => {
    const destino = document.getElementById(id);
    if (destino) destino.scrollIntoView({ block: 'start' });
  };

  const correo = user?.email || '';
  // El WhatsApp del panel manda; si no lo pusieron, el de la configuración.
  const whatsappBorrado = enlaceWhatsApp(`${MENSAJE_BORRADO}${correo}`, negocio.whatsapp);

  // Los otros documentos, para enlazarlos al pie de este.
  const otros = DOCUMENTOS_LEGALES.filter((d) => d.clave !== documento.clave);

  return {
    documento,
    secciones: documento.secciones,
    indice,
    irASeccion,
    volver,
    nombre,
    direccion: ajustes.direccion,
    negocio,
    version: VERSION_LEGAL,
    fecha: FECHA_LEGAL,
    whatsappBorrado,
    otros,
  };
};

// El registro todavía la llama así.
export const useTerminos = () => useDocumentoLegal('terminos');
