import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../api/orderService';
import { useAuth } from './useAuth';

/*
 * ============================================================
 * REPARTO — useReparto.js
 * ============================================================
 * Los pedidos a domicilio que hay que llevar, para quien los lleva.
 *
 * Vive en el área de cliente y no en el panel a propósito: el repartidor
 * trabaja desde el teléfono en la calle, y el panel está pensado para una
 * pantalla grande detrás del mostrador.
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
      /*
       * Solo los de domicilio que aún no se entregaron: un pedido de retiro no
       * se reparte, y uno entregado ya no es trabajo pendiente.
       */
      const paraLlevar = (Array.isArray(todos) ? todos : []).filter(
        (o) => o.deliveryType === 'delivery' && ['pagado', 'preparando', 'en_camino'].includes(o.status)
      );
      setPedidos(paraLlevar);
    } catch (error) {
      console.error('Error cargando el reparto:', error);
    } finally {
      setCargando(false);
    }
  }, [habilitado]);

  useEffect(() => { cargar(); }, [cargar]);

  /*
   * Avanza el estado y deja constancia de quién lo hizo. El nombre viaja al
   * servidor porque es lo que después permite decir "lo entregó Andrés".
   */
  /*
   * `extras` es lo que hace falta SOLO para entregar: los cuatro dígitos que
   * el cliente dicta en la puerta, o la omisión razonada si no los puede
   * mostrar. El servidor los exige en el salto a "entregado". Ver
   * utils/codigoEntrega.js y ModalCodigoEntrega.
   */
  const avanzar = async (pedido, estado, extras = {}) => {
    setMoviendo(pedido._id);
    try {
      await orderService.updateStatus(pedido._id, estado, user?.fullName || user?.userName || '', extras);
      const etiquetas = { preparando: 'Pedido en preparación', en_camino: 'Pedido en camino', entregado: 'Pedido entregado' };
      toast.success(etiquetas[estado] || 'Pedido actualizado');
      await cargar();
    } catch (error) {
      console.error(error);
      /*
       * Se relanza. Quien llama tiene que poder distinguir "se entregó" de
       * "el servidor lo rechazó", y hay dos cosas colgando de eso: el modal
       * del código se queda abierto para volver a intentar, y el viaje en
       * vivo NO se cierra por una entrega que no ocurrió.
       *
       * El aviso al repartidor ya lo pintó el interceptor de api.js.
       */
      throw error;
    } finally {
      setMoviendo(null);
    }
  };

  return { pedidos, cargando, moviendo, habilitado, avanzar, recargar: cargar };
};

/*
 * Enlace de navegación al punto de entrega.
 *
 * Se abre el mapa que la persona ya tiene en el teléfono (Google Maps, Waze,
 * el de Apple) en vez de dibujar una ruta nosotros: ahí tiene navegación por
 * voz, tráfico y calles actualizadas. Construir eso sería peor y de gratis.
 *
 * Con coordenadas apunta al portón exacto; sin ellas, lo mejor que se puede
 * hacer es buscar el texto de la dirección.
 *
 * `origenTienda` es DE DÓNDE sale el reparto — la dirección que se guardó en
 * Personalización, no "mi ubicación" del teléfono que abre el enlace. Sin
 * origin, Google Maps arranca la ruta desde donde esté el GPS del celular en
 * ese momento, que en unas pruebas —o si el repartidor ya anda a medio
 * camino de otra entrega— no es de dónde sale el reparto de verdad.
 */
export const enlaceDeRuta = (pedido, origenTienda) => {
  const origin = origenTienda ? `&origin=${encodeURIComponent(origenTienda)}` : '';
  if (pedido?.deliveryLat != null && pedido?.deliveryLng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${pedido.deliveryLat},${pedido.deliveryLng}${origin}`;
  }
  const texto = encodeURIComponent(pedido?.deliveryAddress || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${texto}${origin}`;
};
