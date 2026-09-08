import { createContext, useContext } from 'react';
import { useMyOrders } from '../hooks/useMyOrders';

/*
 * PedidoActivoContext — los pedidos del cliente, en un solo lugar para toda
 * la sesión.
 *
 * BurbujaPedido vive montada desde que se abre la tienda hasta que se cierra
 * la pestaña —está FUERA de <Routes>, para no desaparecer al navegar—, así
 * que solo pide la lista de pedidos UNA vez, al montarse. Si en ese momento
 * no había ningún pedido en curso, se queda pensando que no hay ninguno: el
 * carrito crea uno nuevo dos componentes más abajo y la burbuja nunca se
 * entera sola.
 *
 * Este contexto centraliza esa lista y expone `refrescar`, para que el
 * carrito avise "hay un pedido nuevo" apenas se confirma el pago. Mismo
 * patrón que DireccionContext.
 */
const PedidoActivoContext = createContext(null);

export const PedidoActivoProvider = ({ children }) => {
  const pedidos = useMyOrders();
  return (
    <PedidoActivoContext.Provider value={pedidos}>
      {children}
    </PedidoActivoContext.Provider>
  );
};

// Fuera del proveedor (o sin sesión) no hay pedidos que mostrar, no un error.
const SIN_PROVEEDOR = { orders: [], loading: false, refrescar: () => {} };

export const usePedidoActivoCtx = () => useContext(PedidoActivoContext) || SIN_PROVEEDOR;
