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
 * ── Qué app se abre ──
 *   - Teléfono Android: un enlace geo:, y el teléfono pregunta con qué abrirlo
 *     (Google Maps, Waze, el que tenga). Antes iba siempre a Google Maps.
 *   - iPhone: Apple Maps, que es el que trae el teléfono.
 *   - Computadora: Google Maps en el navegador, como antes.
 *
 * `origenTienda` es DE DÓNDE sale el reparto — la dirección que se guardó en
 * Personalización. Solo se usa en la computadora: ahí no hay GPS y la ruta
 * tiene que salir de algún lado. En el teléfono la app de mapas arranca desde
 * donde está el repartidor, que es lo que sirve para manejar.
 */
const esAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
const esIPhone = () =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const enlaceDeRuta = (pedido, origenTienda) => {
  const hayPunto = pedido?.deliveryLat != null && pedido?.deliveryLng != null;
  const punto = hayPunto ? `${pedido.deliveryLat},${pedido.deliveryLng}` : '';
  const texto = encodeURIComponent(pedido?.deliveryAddress || '');

  if (esAndroid()) {
    const quien = encodeURIComponent(`Entrega a ${pedido?.clientId?.fullName || 'cliente'}`);
    return hayPunto ? `geo:${punto}?q=${punto}(${quien})` : `geo:0,0?q=${texto}`;
  }
  if (esIPhone()) return `https://maps.apple.com/?daddr=${hayPunto ? punto : texto}`;

  const origin = origenTienda ? `&origin=${encodeURIComponent(origenTienda)}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${hayPunto ? punto : texto}${origin}`;
};

// Un geo: se abre en la misma pestaña (lo toma la app de mapas); una página, en otra.
export const abreEnOtraPestana = (enlace) => /^https?:/.test(enlace);
