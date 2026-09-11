import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPedidosDeCliente } from '../api/pedidosApi';

/*
 * ============================================================
 * PEDIDO ACTIVO — PedidoActivoContext.js
 * ============================================================
 * Copia de `frontend/src/context/PedidoActivoContext.jsx`: los pedidos del
 * cliente, en un solo lugar para toda la sesión.
 *
 * BurbujaPedido vive montada desde que arranca la app hasta que se cierra
 * —fuera del stack de pantallas, para no desaparecer al navegar—, así que
 * la lista de pedidos se pide al montarse Y de ahí en adelante cada rato:
 * el checkout ya llama a `refrescar` apenas se confirma un pago (para que
 * la burbuja se entere sin esperar), pero el estado de un pedido también
 * cambia desde el panel del personal —"Preparando", "Salió a reparto"— y
 * de ESO el teléfono no tiene forma de enterarse solo. Sin este refresco
 * periódico, la burbuja se quedaba mostrando "Recibido" mientras el
 * repartidor ya iba en camino, hasta que alguien cerrara y abriera la app.
 *
 * useSeguimientoEnVivo (más rápido, cada 10s) ya trae el estado fresco del
 * pedido QUE SE ESTÁ SIGUIENDO; esto es lo que hacía falta además: que la
 * LISTA se mantenga al día, para el caso en que cambie CUÁL es el pedido en
 * curso (por ejemplo, si el anterior se entregó y hay uno más nuevo).
 * ============================================================
 */

const CADA_CUANTO_REFRESCAR_MS = 20000;

const PedidoActivoContext = createContext(null);

export const PedidoActivoProvider = ({ children }) => {
  const { user } = useAuth();
  const esCliente = user?.type === 'client' && !!user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!esCliente) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getPedidosDeCliente(user.id);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // Un fallo aquí no debe tumbar la tienda: se queda sin burbuja, no sin tienda.
    } finally {
      setLoading(false);
    }
  }, [esCliente, user?.id]);

  useEffect(() => {
    cargar();
    if (!esCliente) return;
    const reloj = setInterval(cargar, CADA_CUANTO_REFRESCAR_MS);
    return () => clearInterval(reloj);
  }, [cargar, esCliente]);

  return (
    <PedidoActivoContext.Provider value={{ orders, loading, refrescar: cargar }}>
      {children}
    </PedidoActivoContext.Provider>
  );
};

// Sin proveedor (no debería pasar, pero por las dudas) no hay pedidos que
// mostrar, no un error.
const SIN_PROVEEDOR = { orders: [], loading: false, refrescar: () => {} };

export const usePedidoActivoCtx = () => useContext(PedidoActivoContext) || SIN_PROVEEDOR;
