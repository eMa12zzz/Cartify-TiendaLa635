import { Package, ChefHat, Bike, Check } from 'lucide-react-native';

/*
 * ============================================================
 * LOS PASOS DE UN PEDIDO — pasosPedido.js
 * ============================================================
 * Por dónde va un pedido, escrito UNA sola vez. Copia de
 * `frontend/src/utils/pasosPedido.js`, con lucide-react-native en vez de
 * lucide-react — mismos iconos, mismo trazo.
 *
 * El problema que resuelve del lado de la web era tener esta lista copiada
 * en tres pantallas, con una copia que se había quedado sin "En camino". Del
 * lado del teléfono la app ya tenía el mismo problema por su cuenta:
 * Confirmacion.js traía sus propios tres pasos («Recibida, En camino,
 * Entregada») sin «Preparando», y Pedidos.js no sabía pintar 'en_camino' en
 * la lista de pedidos. Una sola lista es la manera de que no se repita.
 * ============================================================
 */

export const PASOS_TODOS = [
  { id: 'pagado', label: 'Recibido', detalle: 'Su pedido entró a la tienda', Icono: Package },
  { id: 'preparando', label: 'Preparando', detalle: 'Están juntando sus productos', Icono: ChefHat },
  { id: 'en_camino', label: 'En camino', detalle: 'Un repartidor va para su casa', Icono: Bike },
  { id: 'entregado', label: 'Entregado', detalle: '¡Que lo disfrute!', Icono: Check },
];

/*
 * Los pasos que le tocan a ESTE pedido. "En camino" solo existe para
 * domicilio: un retiro en el local no tiene a quién seguirle el mapa.
 */
export const pasosDe = (deliveryType) =>
  deliveryType === 'delivery'
    ? PASOS_TODOS
    : PASOS_TODOS.filter((p) => p.id !== 'en_camino');

/*
 * En qué paso está, como índice dentro de la lista que le toca. Devuelve 0
 * cuando el estado no está en la lista (un pedido recién creado) — eso es un
 * respaldo, NO la forma de resolver un estado que falta: para eso está
 * pasosDe.
 */
export const indiceDePaso = (pasos, estado) => {
  const i = pasos.findIndex((p) => p.id === estado);
  return i === -1 ? 0 : i;
};

/*
 * La etiqueta y el color de cada estado, para las chapas de "Pagado",
 * "Cancelado", etc. Vivían copiados dentro de Pedidos.js nada más; se centran
 * aquí por la misma razón que PASOS_TODOS: ModalPedido.js los necesita
 * también, y una lista que se edita en dos lugares es una que un día se edita
 * solo en uno.
 */
export const ESTADOS_PEDIDO = {
  pagado: { texto: 'Pagado', color: '#2563EB', fondo: '#E8EFFD' },
  preparando: { texto: 'Preparando', color: '#D97706', fondo: '#FBF0DF' },
  en_camino: { texto: 'En camino', color: '#1D4ED8', fondo: '#E3EAFB' },
  entregado: { texto: 'Entregado', color: '#16A34A', fondo: '#E4F5EA' },
  cancelado: { texto: 'Cancelado', color: '#DC2626', fondo: '#FBE7E7' },
};
