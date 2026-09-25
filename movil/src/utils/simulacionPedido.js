/*
 * ============================================================
 * SIMULADOR DE PEDIDO — solo en desarrollo
 * ============================================================
 * Para ver de punta a punta cómo se vive un pedido a domicilio —la burbuja,
 * el mapa con el repartidor acercándose, el "ya casi", el código de entrega
 * y los avisos que suenan— sin hacer un pedido de verdad.
 *
 * NO escribe nada en ningún lado. La base es la de producción: un pedido de
 * prueba ahí descontaría inventario y le llegaría al personal. En cambio, la
 * API de pedidos (api/pedidosApi.js) pregunta aquí antes de ir al servidor:
 *   · la lista de pedidos lleva este pedido de prueba adelante de los reales;
 *   · la posición del repartidor de este pedido sale de aquí.
 *
 * Los avisos salen del mismo teléfono (avisoLocal), con los MISMOS textos que
 * manda el servidor (backend/src/utils/avisosCliente.js y avisoPromo.js).
 * Si allá cambian, se cambian aquí.
 *
 * Solo existe con __DEV__: en la app que se publica, el menú que lo arranca
 * no aparece y la API nunca lo consulta.
 * ============================================================
 */

import { avisoLocal } from './notificaciones';

// El id del pedido de prueba. No es un id de Mongo: si por error llegara al
// servidor, lo rechazaría sin tocar nada.
export const ID_SIMULADO = 'pedido-de-prueba';
export const esPedidoSimulado = (id) => id === ID_SIMULADO;

/*
 * El recorrido, en segundos desde que se arranca. Comprimido: un pedido de
 * verdad tarda media hora; aquí dos minutos y medio. El viaje dura 90
 * segundos para que el repartidor se vea avanzar varias veces en el mapa
 * (la app pregunta su posición cada 10).
 */
const PREPARANDO_EN = 15;
const EN_CAMINO_EN = 35;
const DURACION_VIAJE = 90;
const ENTREGADO_EN = EN_CAMINO_EN + DURACION_VIAJE + 5;

// De dónde sale el repartidor respecto a la casa: unos 1.6 km al noreste.
const SALIDA = { lat: 0.0115, lng: 0.0105 };
// Si no hay una dirección de verdad con coordenadas, una en San Salvador.
const DESTINO_POR_DEFECTO = { lat: 13.7035, lng: -89.2244 };

// Los textos que manda el servidor (backend/src/utils/avisosCliente.js).
export const AVISO_EN_CAMINO = {
  titulo: 'Su pedido va en camino',
  cuerpo: 'Ya salió de la tienda. Puede verlo en el mapa y saber cuándo salir a la puerta.',
};

let sim = null;
const relojes = [];
const oyentes = new Set();

const avisarCambio = () => oyentes.forEach((fn) => fn());

// Para que quien muestra los pedidos se entere al instante de cada paso, sin
// esperar a su siguiente consulta.
export const suscribirseASimulacion = (fn) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};

export const simulacionActiva = () => !!sim;

const segundos = () => (Date.now() - sim.inicio) / 1000;

const estadoActual = () => {
  const s = segundos();
  if (s < PREPARANDO_EN) return 'pagado';
  if (s < EN_CAMINO_EN) return 'preparando';
  if (s < ENTREGADO_EN) return 'en_camino';
  return 'entregado';
};

/*
 * Arranca un pedido de prueba. `plantilla` es un pedido real del cliente (si
 * tiene alguno): de ahí salen los productos y el total, para que se vea como
 * uno de verdad. `destino` es a dónde va.
 */
export const iniciarSimulacion = ({ plantilla = null, destino = null } = {}) => {
  detenerSimulacion();
  const casa =
    destino?.lat != null && destino?.lng != null
      ? destino
      : plantilla?.deliveryLat != null && plantilla?.deliveryLng != null
        ? { lat: plantilla.deliveryLat, lng: plantilla.deliveryLng }
        : DESTINO_POR_DEFECTO;
  sim = {
    inicio: Date.now(),
    plantilla,
    destino: casa,
    salida: { lat: casa.lat + SALIDA.lat, lng: casa.lng + SALIDA.lng },
  };

  // Cada cambio de paso se anuncia a quien muestra el pedido.
  [PREPARANDO_EN, EN_CAMINO_EN, ENTREGADO_EN].forEach((s) => relojes.push(setTimeout(avisarCambio, s * 1000 + 50)));

  // El aviso que de verdad manda el servidor cuando el pedido sale.
  relojes.push(setTimeout(() => {
    avisoLocal({ ...AVISO_EN_CAMINO, datos: { tipo: 'pedidoEnCamino', pedidoId: ID_SIMULADO } });
  }, EN_CAMINO_EN * 1000));

  // Al terminar, el pedido de prueba se va solo un rato después.
  relojes.push(setTimeout(detenerSimulacion, (ENTREGADO_EN + 60) * 1000));

  avisarCambio();
};

export const detenerSimulacion = () => {
  relojes.splice(0).forEach(clearTimeout);
  const habia = !!sim;
  sim = null;
  if (habia) avisarCambio();
};

// El pedido de prueba, con la misma forma que los del servidor.
export const pedidoSimulado = () => {
  if (!sim) return null;
  const p = sim.plantilla || {};
  const items = Array.isArray(p.items) && p.items.length
    ? p.items
    : [{ productId: null, name: 'Manzana', price: 5.2, amount: 2 }];
  const total = typeof p.total === 'number' ? p.total : items.reduce((t, i) => t + (i.price || 0) * (i.amount || 1), 0);
  return {
    ...p,
    _id: ID_SIMULADO,
    status: estadoActual(),
    deliveryType: 'delivery',
    deliveryAddress: p.deliveryAddress || 'Dirección de prueba',
    deliveryLat: sim.destino.lat,
    deliveryLng: sim.destino.lng,
    deliveryCode: '4827',
    createdAt: new Date(sim.inicio).toISOString(),
    items,
    total,
    // Sin valoraciones: calificar un pedido de prueba escribiría reseñas de verdad.
    rating: undefined,
    simulado: true,
  };
};

// Lo mismo que devuelve GET /order/:id/courier, con el repartidor avanzando.
export const repartidorSimulado = () => {
  if (!sim) return { status: 'cancelado', deliveryType: 'delivery', destino: null, courier: null };
  const status = estadoActual();
  let courier = null;
  if (status === 'en_camino') {
    const avance = Math.min(1, (segundos() - EN_CAMINO_EN) / DURACION_VIAJE);
    courier = {
      active: true,
      lat: sim.salida.lat + (sim.destino.lat - sim.salida.lat) * avance,
      lng: sim.salida.lng + (sim.destino.lng - sim.salida.lng) * avance,
      name: 'Carlos (prueba)',
      updatedAt: new Date().toISOString(),
    };
  }
  return { status, deliveryType: 'delivery', destino: sim.destino, courier };
};

/*
 * Los otros dos avisos que manda el servidor, para ver cómo se ven. Mismos
 * textos y la misma carga que en avisosCliente.js y avisoPromo.js.
 */
export const probarAvisoProductosNuevos = () =>
  avisoLocal({
    titulo: '3 productos nuevos',
    cuerpo: 'Churritos Diana, Jugo de naranja, Pan dulce',
    datos: { tipo: 'productosNuevos' },
  });

export const probarAvisoPromo = () =>
  avisoLocal({
    titulo: 'Churritos Diana al 2x1',
    cuerpo: 'Solo hoy: lleve dos y pague uno.',
    datos: { tipo: 'promo', promoId: 'prueba' },
  });
