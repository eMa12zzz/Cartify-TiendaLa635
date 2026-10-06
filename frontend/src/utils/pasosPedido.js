import { Package, ChefHat, Bike, Check, Store } from 'lucide-react';

/*
 * ============================================================
 * LOS PASOS DE UN PEDIDO — pasosPedido.js
 * ============================================================
 * Por dónde va un pedido, escrito UNA sola vez.
 *
 * EL PROBLEMA QUE RESUELVE
 * Esta lista estaba copiada en tres pantallas —la burbuja, el estado del
 * pedido y la confirmación del pago— y la tercera copia se quedó atrás: le
 * faltaba el paso "En camino".
 *
 * Eso no era un detalle estético. La confirmación busca el estado dentro de
 * la lista para saber qué paso pintar; al no encontrar 'en_camino' devolvía
 * -1, y un `Math.max(0, -1)` lo convertía en 0. Traducido: un pedido a
 * domicilio que YA IBA EN LA MOTO le aparecía al cliente como "Recibido",
 * justo en la pantalla que mira mientras espera.
 *
 * Con una sola lista, agregar o renombrar un paso pasa a ser un cambio en un
 * archivo en vez de tres, y no hay una tercera copia que se quede vieja.
 * ============================================================
 */

/*
 * `pose` es la ilustración de la mascota para ese paso (ver
 * components/UI/Mascota.jsx). El ícono sigue para la línea de tiempo, donde
 * todo tiene que caber en un círculo chico.
 */
export const PASOS_TODOS = [
  { id: 'pagado', label: 'Recibido', detalle: 'Tu pedido entró a la tienda', Icono: Package, pose: 'recibido' },
  { id: 'preparando', label: 'Preparando', detalle: 'Están juntando tus productos', Icono: ChefHat, pose: 'preparando' },
  { id: 'en_camino', label: 'En camino', detalle: 'Un repartidor va para tu casa', Icono: Bike, pose: 'en-camino' },
  // Solo retiro en la tienda: el aviso de "ya puede pasar por él".
  { id: 'listo', label: 'Listo para recoger', detalle: 'Ya puedes pasar por él a la tienda', Icono: Store, pose: 'entregado' },
  { id: 'entregado', label: 'Entregado', detalle: '¡Que lo disfrutes!', Icono: Check, pose: 'entregado' },
];

/*
 * La ilustración de un estado cualquiera, incluido "cancelado", que no es un
 * paso de la lista (un pedido cancelado no avanza a ningún lado).
 */
export const poseDeEstado = (estado) =>
  estado === 'cancelado'
    ? 'cancelado'
    : (PASOS_TODOS.find((p) => p.id === estado) || PASOS_TODOS[0]).pose;

/*
 * Los pasos que le tocan a ESTE pedido.
 *
 * "En camino" solo existe para domicilio: un retiro en el local no tiene a
 * quién seguirle el mapa, y pintarle ese paso a alguien que va a pasar por su
 * bolsa es prometerle un repartidor que no va a salir.
 */
export const pasosDe = (deliveryType) =>
  deliveryType === 'delivery'
    ? PASOS_TODOS.filter((p) => p.id !== 'listo')
    : PASOS_TODOS.filter((p) => p.id !== 'en_camino');

/*
 * En qué paso está, como índice dentro de la lista que le toca.
 *
 * Devuelve 0 cuando el estado no está en la lista, que es lo que hay que
 * hacer con un pedido recién creado. Ojo: eso es un respaldo, NO la forma de
 * resolver un estado que falta en la lista — para eso está pasosDe.
 */
export const indiceDePaso = (pasos, estado) => {
  const i = pasos.findIndex((p) => p.id === estado);
  return i === -1 ? 0 : i;
};

/*
 * Lo que se le devolvió al cliente al cancelar su pedido, dicho en una frase:
 * "Le devolvimos $4.50 a su saldo y 200 puntos." Vacío si no hubo nada que
 * devolver (pagó en efectivo sin canjear puntos). Lo anota el servidor en
 * `reembolso` al cancelar; ver backend/src/utils/devolverPedido.js.
 */
/*
 * De un pedido que devolvió el servidor al cancelarlo, solo el estado y los
 * sellos de la cancelación. Se mezclan sobre el pedido que ya está en
 * pantalla en vez de reemplazarlo: el de la respuesta viene sin el cliente ni
 * los productos poblados, y la tarjeta se quedaría sin nombres.
 */
export const sellosDeCancelacion = (pedido) => {
  const sellos = {};
  ['status', 'cancelReason', 'cancelledAt', 'cancelledBy', 'cancelledByClient', 'reembolso'].forEach((k) => {
    if (pedido?.[k] !== undefined) sellos[k] = pedido[k];
  });
  return sellos;
};

export const textoDevuelto = (pedido) => {
  const saldo = Number(pedido?.reembolso?.saldo) || 0;
  const puntos = Number(pedido?.reembolso?.puntos) || 0;
  const partes = [saldo > 0 ? `$${saldo.toFixed(2)} a tu saldo` : '', puntos > 0 ? `${puntos} puntos` : '']
    .filter(Boolean);
  return partes.length ? `Te devolvimos ${partes.join(' y ')}.` : '';
};
