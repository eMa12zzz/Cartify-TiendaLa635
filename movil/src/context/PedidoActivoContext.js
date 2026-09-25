import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPedidosDeCliente } from '../api/pedidosApi';
import { suscribirseASimulacion } from '../utils/simulacionPedido';

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
 *
 * ── `pedidoAbierto`: el detalle de UN pedido, para toda la app ──
 * El modal de detalle (ModalPedido) lo abren dos lugares distintos: la
 * tarjeta de "Mis pedidos" (Pedidos.js) y el botón "Ver el pedido" de la
 * propia burbuja (BurbujaPedido.js). Antes cada uno tenía su propio
 * `useState` y su propio `<ModalPedido>` — y el de Pedidos.js vivía metido
 * DENTRO del stack de pantallas, varios niveles abajo de `BurbujaPedido`
 * (que cuelga directo de App.js, afuera del navegador). En Android el
 * `elevation` de una pantalla del stack (react-native-screens monta cada
 * una en su propio contenedor nativo) no se compara de forma confiable
 * contra el de un hermano de OTRO árbol — se veía la burbuja asomando a
 * medias por encima del fondo oscuro del modal, partida por la mitad.
 *
 * La solución no es subirle el número a nadie: es que el modal se pinte en
 * un solo lugar, hermano de `BurbujaPedido` en App.js, para que a quién
 * gana el de arriba lo decida el orden normal de pintado (el último hijo
 * gana) y no una comparación de elevation entre dos árboles nativos
 * distintos. `pedidoAbierto` es SOLO ese: qué pedido se está mirando en
 * detalle ahora mismo, sin que importe desde dónde se abrió.
 * ============================================================
 */

const CADA_CUANTO_REFRESCAR_MS = 20000;

const PedidoActivoContext = createContext(null);

export const PedidoActivoProvider = ({ children }) => {
  const { user } = useAuth();
  const esCliente = user?.type === 'client' && !!user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoAbierto, setPedidoAbierto] = useState(null);

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

  // En desarrollo, cada paso del pedido de prueba se ve al instante, sin
  // esperar los 20 segundos de la siguiente consulta.
  useEffect(() => (__DEV__ ? suscribirseASimulacion(cargar) : undefined), [cargar]);

  const cerrarPedidoAbierto = useCallback(() => setPedidoAbierto(null), []);

  return (
    <PedidoActivoContext.Provider
      value={{
        orders,
        loading,
        refrescar: cargar,
        pedidoAbierto,
        abrirPedido: setPedidoAbierto,
        cerrarPedidoAbierto,
      }}
    >
      {children}
    </PedidoActivoContext.Provider>
  );
};

// Sin proveedor (no debería pasar, pero por las dudas) no hay pedidos que
// mostrar, no un error.
const SIN_PROVEEDOR = {
  orders: [],
  loading: false,
  refrescar: () => {},
  pedidoAbierto: null,
  abrirPedido: () => {},
  cerrarPedidoAbierto: () => {},
};

export const usePedidoActivoCtx = () => useContext(PedidoActivoContext) || SIN_PROVEEDOR;
