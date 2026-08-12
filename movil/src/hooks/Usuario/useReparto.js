import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../api/Usuario/orderService';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * ============================================================
 * REPARTO — useReparto.js
 * ============================================================
 * Puerto de `frontend/src/hooks/useReparto.js`. Los pedidos a domicilio que
 * hay que llevar, para quien los lleva.
 *
 * Vive en el área de cliente a propósito: el repartidor trabaja desde el
 * teléfono en la calle.
 * ============================================================
 */

// Solo empleados y administradores reparten.
export const puedeRepartir = (user) => !!user && user.type !== 'client';

export const useReparto = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [moviendo, setMoviendo] = useState(null);

  const habilitado = puedeRepartir(user);

  const cargar = useCallback(async () => {
    if (!habilitado) { setCargando(false); return; }
    try {
      setCargando(true);
      const todos = await orderService.getAllOrders();
      // Solo domicilios que aún no se entregaron: un retiro no se reparte, y
      // un entregado ya no es trabajo pendiente.
      const paraLlevar = (Array.isArray(todos) ? todos : []).filter(
        (o) => o.deliveryType === 'delivery' && ['pagado', 'preparando'].includes(o.status)
      );
      setPedidos(paraLlevar);
    } catch (error) {
      console.error('Error cargando el reparto:', error);
    } finally {
      setCargando(false);
    }
  }, [habilitado]);

  useEffect(() => { cargar(); }, [cargar]);

  // Avanza el estado y deja constancia de quién lo hizo.
  const avanzar = async (pedido, estado) => {
    setMoviendo(pedido._id);
    try {
      await orderService.updateStatus(pedido._id, estado, user?.fullName || user?.userName || '');
      aviso(estado === 'entregado' ? 'Pedido entregado' : 'Pedido en preparación');
      await cargar();
    } catch (error) {
      console.error(error);
    } finally {
      setMoviendo(null);
    }
  };

  return { pedidos, cargando, moviendo, habilitado, avanzar, recargar: cargar };
};

/*
 * Enlace de navegación al punto de entrega. Se abre el mapa que la persona ya
 * tiene en el teléfono (Google Maps, Waze) con Linking.openURL: ahí ya hay
 * navegación por voz y tráfico. Con coordenadas apunta al portón exacto; sin
 * ellas, busca el texto de la dirección.
 */
export const enlaceDeRuta = (pedido) => {
  if (pedido?.deliveryLat != null && pedido?.deliveryLng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${pedido.deliveryLat},${pedido.deliveryLng}`;
  }
  const texto = encodeURIComponent(pedido?.deliveryAddress || '');
  return `https://www.google.com/maps/search/?api=1&query=${texto}`;
};

export default useReparto;
