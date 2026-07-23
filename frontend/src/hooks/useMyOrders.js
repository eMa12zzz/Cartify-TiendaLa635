import { useState, useEffect } from 'react';
import { orderService } from '../api/orderService';
import { useAuth } from './useAuth';

/*
 * useMyOrders — trae los pedidos del cliente logueado (su historial).
 * La lógica de carga vive aquí; la página MisPedidos solo pinta la lista.
 * Opcionalmente filtra por estado (ej. 'entregado' para la vista de Recibos).
 */
export const useMyOrders = (statusFilter = null) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await orderService.getMyOrders(user.id);
        const lista = Array.isArray(data) ? data : [];
        // Si nos pidieron un estado específico, filtramos aquí.
        setOrders(statusFilter ? lista.filter((o) => o.status === statusFilter) : lista);
      } catch (error) {
        console.error('Error cargando pedidos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id, statusFilter]);

  return { orders, loading };
};
