import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../api/orderService';

/*
 * useOrders — para el ADMIN/EMPLEADO: trae todos los pedidos y permite avanzar
 * su estado (pagado → preparando → entregado). La lógica vive aquí; la página
 * Orders solo pinta las tarjetas y llama a cambiarEstado.
 */
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      // Actualización optimista: reflejamos el cambio sin recargar todo.
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      const etiquetas = { preparando: 'En preparación', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
      toast.success(`Pedido: ${etiquetas[status] || status}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  return { orders, loading, cargar, cambiarEstado };
};
