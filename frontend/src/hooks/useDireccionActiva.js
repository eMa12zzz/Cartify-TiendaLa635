import { useCallback, useSyncExternalStore } from 'react';
import { useAddresses } from './useAddresses';
import { useAuth } from './useAuth';

/*
 * ============================================================
 * DIRECCIÓN ACTIVA — useDireccionActiva.js
 * ============================================================
 * A dónde le llevamos el pedido, elegido una vez y respetado en toda la
 * tienda.
 *
 * Antes la dirección se escogía hasta el final, dentro del carrito, y
 * arrancaba siempre en la primera de la lista. Eso obliga a acordarse de
 * cambiarla justo cuando uno solo quiere terminar de pagar — y el día que se
 * olvida, el pedido sale para la casa equivocada. Ahora se elige arriba,
 * donde se ve siempre, y el carrito nada más la usa.
 *
 * La elección vive en el teléfono (localStorage), no en un useState: así
 * quien casi siempre pide para la casa no tiene que volver a elegirla cada
 * vez, y si tiene la tienda abierta en dos pestañas, las dos se enteran.
 * ============================================================
 */

const llave = (userId) => `kartify:direccion-activa:${userId || 'invitado'}`;

// Aviso propio: `storage` solo lo oyen las OTRAS pestañas, nunca la que
// escribió. Sin esto, elegir arriba no se reflejaría en el carrito de al lado.
const EVENTO = 'kartify:direccion-cambio';

const suscribir = (avisar) => {
  window.addEventListener('storage', avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener('storage', avisar);
    window.removeEventListener(EVENTO, avisar);
  };
};

export const useDireccionActiva = () => {
  const { user } = useAuth();
  const { addresses, loading, saving, agregar, eliminar } = useAddresses();

  /*
   * localStorage es estado que vive FUERA de React; leerlo con un efecto que
   * llama a setState provoca un render de más y el linter lo rechaza con
   * razón. useSyncExternalStore es exactamente la herramienta para esto.
   */
  const guardado = useSyncExternalStore(
    suscribir,
    () => localStorage.getItem(llave(user?.id)),
    () => null
  );

  /*
   * Si la dirección guardada ya no existe (la borró desde Mi Cuenta), se cae
   * a la primera en vez de quedarse apuntando a un hueco. Mandar un pedido a
   * `undefined` sería peor que mandarlo a la casa por defecto.
   */
  const crudo = Number(guardado);
  const indice = Number.isInteger(crudo) && crudo >= 0 && crudo < addresses.length ? crudo : 0;

  const elegir = useCallback((i) => {
    localStorage.setItem(llave(user?.id), String(i));
    window.dispatchEvent(new Event(EVENTO));
  }, [user?.id]);

  const activa = addresses[indice] || null;

  /*
   * Cómo se llama esta dirección en un espacio chico. El nombre que le puso
   * la persona ("Casa", "Donde mi mamá") gana siempre: es más fácil de
   * reconocer de reojo que la calle y el número.
   */
  const etiqueta = activa ? (activa.nombre || activa.direccion || 'Sin nombre') : '';

  return {
    direcciones: addresses,
    activa,
    indice,
    etiqueta,
    cargando: loading,
    guardando: saving,
    elegir,
    agregar,
    eliminar,
  };
};
