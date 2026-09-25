import { Package, ChefHat, Bike, Check, Store } from 'lucide-react-native';
import { COLORES_OSCURO } from '../theme/colores';

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
  // `pose`: cómo sale Tiqui en ese paso (components/Tiqui/Mascota.js), igual que en la web.
  { id: 'pagado', label: 'Recibido', detalle: 'Su pedido entró a la tienda', Icono: Package, pose: 'recibido' },
  { id: 'preparando', label: 'Preparando', detalle: 'Están juntando sus productos', Icono: ChefHat, pose: 'preparando' },
  { id: 'en_camino', label: 'En camino', detalle: 'Un repartidor va para su casa', Icono: Bike, pose: 'en-camino' },
  // Solo retiro en la tienda: el aviso de "ya puede pasar por él".
  { id: 'listo', label: 'Listo para recoger', detalle: 'Ya puede pasar por él a la tienda', Icono: Store, pose: 'entregado' },
  { id: 'entregado', label: 'Entregado', detalle: '¡Que lo disfrute!', Icono: Check, pose: 'entregado' },
];

/*
 * La pose de Tiqui para un estado cualquiera, incluido "cancelado", que no
 * es un paso de la lista (un pedido cancelado no avanza a ningún lado).
 */
export const poseDeEstado = (estado) =>
  estado === 'cancelado'
    ? 'cancelado'
    : (PASOS_TODOS.find((p) => p.id === estado) || PASOS_TODOS[0]).pose;

/*
 * Los pasos que le tocan a ESTE pedido. "En camino" solo existe para
 * domicilio: un retiro en el local no tiene a quién seguirle el mapa.
 */
export const pasosDe = (deliveryType) =>
  deliveryType === 'delivery'
    ? PASOS_TODOS.filter((p) => p.id !== 'listo')
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
  listo: { texto: 'Listo para recoger', color: '#6D28D9', fondo: '#EFE8FB' },
  entregado: { texto: 'Entregado', color: '#16A34A', fondo: '#E4F5EA' },
  cancelado: { texto: 'Cancelado', color: '#DC2626', fondo: '#FBE7E7' },
};

/*
 * En modo oscuro las chapas salen de los colores de estado de la paleta
 * oscura: un fondo pastel sobre negro deslumbra, y un azul oscuro sobre fondo
 * oscuro no se lee.
 */
const ESTADOS_PEDIDO_OSCURO = {
  pagado: { texto: 'Pagado', color: COLORES_OSCURO.infoVivo, fondo: COLORES_OSCURO.infoFondo },
  preparando: { texto: 'Preparando', color: COLORES_OSCURO.avisoVivo, fondo: COLORES_OSCURO.avisoFondo },
  en_camino: { texto: 'En camino', color: COLORES_OSCURO.infoVivo, fondo: COLORES_OSCURO.infoFondo },
  listo: { texto: 'Listo para recoger', color: '#C4B5FD', fondo: '#241B38' },
  entregado: { texto: 'Entregado', color: COLORES_OSCURO.exitoVivo, fondo: COLORES_OSCURO.exitoFondo },
  cancelado: { texto: 'Cancelado', color: COLORES_OSCURO.peligro, fondo: COLORES_OSCURO.peligroFondo },
};

export const estadosPedido = (oscuro) => (oscuro ? ESTADOS_PEDIDO_OSCURO : ESTADOS_PEDIDO);
