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

  /*
   * `extras` viaja tal cual al backend. Hoy lo usa la entrega para mandar el
   * código que el cliente dictó (o la omisión razonada); ver orderService.
   */
  const cambiarEstado = async (id, status, extras = {}) => {
    try {
      await orderService.updateStatus(id, status, undefined, extras);
      // Actualización optimista: reflejamos el cambio sin recargar todo.
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      const etiquetas = { preparando: 'En preparación', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
      toast.success(`Pedido: ${etiquetas[status] || status}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      /*
       * Se vuelve a lanzar. Antes se tragaba el error y quien llamaba no tenía
       * forma de saber si el cambio había entrado: el modal del código de
       * entrega necesita quedarse ABIERTO cuando el código no coincide, para
       * que se pueda volver a intentar sin buscar el pedido otra vez.
       *
       * El aviso al usuario ya lo pintó el interceptor de api.js; esto solo
       * devuelve el "no se pudo" a la pantalla.
       */
      throw error;
    }
  };

  return { orders, loading, cargar, cambiarEstado };
};
