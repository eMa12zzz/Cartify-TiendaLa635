import { usePedidoActivoCtx } from '../../context/PedidoActivoContext';
import ModalPedido from './ModalPedido';

/*
 * ============================================================
 * PEDIDO DETALLE FLOTANTE — un solo lugar para el modal de detalle
 * ============================================================
 * Vive como hermano de `BurbujaPedido` en App.js, no dentro de Pedidos.js ni
 * de la propia burbuja: ver el porqué (el bug de Android con `elevation`
 * entre pantallas del stack) en el comentario grande de
 * `PedidoActivoContext.js`, junto a `pedidoAbierto`.
 *
 * Este componente no decide NADA — ni cuándo abrir, ni cuál pedido: eso lo
 * arma quien toca la tarjeta (Pedidos.js) o el botón "Ver el pedido"
 * (BurbujaPedido.js), los dos contra el mismo `abrirPedido` del contexto.
 * Aquí solo se pinta el resultado, en el lugar del árbol donde se pinta
 * bien.
 * ============================================================
 */
const PedidoDetalleFlotante = () => {
  const { pedidoAbierto, cerrarPedidoAbierto } = usePedidoActivoCtx();

  if (!pedidoAbierto) return null;

  return <ModalPedido pedido={pedidoAbierto} alCerrar={cerrarPedidoAbierto} />;
};

export default PedidoDetalleFlotante;
