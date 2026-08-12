import { useState, useEffect } from 'react';
import { orderService } from '../../api/Usuario/orderService';
import { useAuth } from '../useAuth';

/*
 * useMyOrders — trae los pedidos del cliente logueado (su historial).
 * Puerto de `frontend/src/hooks/useMyOrders.js`. Opcionalmente filtra por
 * estado (ej. 'entregado' para la vista de Recibos).
 */
export const useMyOrders = (statusFilter = null) => {
  // Los pedidos son de un CLIENTE: con sesión de personal se preguntaría por
  // los pedidos de un id que no es de nadie. Ver `esCliente` en AuthContext.
  const { user, esCliente } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!esCliente) { setLoading(false); return; }
      try {
        setLoading(true);
        const data = await orderService.getMyOrders(user.id);
        const lista = Array.isArray(data) ? data : [];
        setOrders(statusFilter ? lista.filter((o) => o.status === statusFilter) : lista);
      } catch (error) {
        console.error('Error cargando pedidos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id, esCliente, statusFilter]);

  return { orders, loading };
};

export default useMyOrders;
