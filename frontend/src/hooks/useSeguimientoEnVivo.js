import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../api/orderService';
import { distanciaMetros, minutosDeViaje, textoDeEspera, formatoDistancia } from '../utils/geo';

/*
 * ============================================================
 * SEGUIMIENTO EN VIVO — useSeguimientoEnVivo.js
 * ============================================================
 * El lado del cliente: preguntar cada pocos segundos dónde va el repartidor
 * y traducirlo a algo que se entienda ("llega en 10 min aprox.").
 *
 * Por qué preguntar y no un socket: el backend es Express pelado, sin
 * socket.io. Una consulta cada 10 segundos a una ruta que devuelve cuatro
 * números es más barata que sumar una dependencia y un servidor de sockets
 * para una tienda de barrio con dos repartos a la vez.
 *
 * Lo importante de aquí es `senalFria`: si la última posición tiene más de
 * minuto y medio, se deja de mostrar el puntito como si fuera de ahorita. Un
 * punto viejo haciéndose el vivo es peor que no tener punto, porque el
 * cliente sale a la puerta a esperar a alguien que va tres calles atrás.
 * ============================================================
 */

const CADA_CUANTO_MS = 10000;      // se pregunta cada 10 segundos
const SENAL_FRIA_MS = 90000;       // sin noticias en minuto y medio: se avisa

/*
 * A esta distancia se avisa que ya casi tocan la puerta.
 *
 * 250 metros son como dos cuadras: el punto justo donde vale la pena
 * levantarse. Antes es falsa alarma y uno se queda parado en la puerta; y si
 * se espera a que esté enfrente, el repartidor termina tocando dos veces
 * mientras la persona busca las llaves.
 */
const YA_CASI_M = 250;

export const useSeguimientoEnVivo = (pedidoId, activo = true) => {
  /*
   * Todo en un solo estado y con el id adentro. Así, cuando se cambia de
   * pedido, lo que quedó del anterior se descarta al comparar en vez de
   * tener que limpiarlo a mano y provocar un render de más.
   */
  const [datos, setDatos] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  /*
   * El punto anterior, para medir a qué velocidad viene de verdad. Solo se
   * toca dentro de la consulta (nunca al pintar), que es justo para lo que
   * sirve un ref.
   */
  const anteriorRef = useRef(null);

  // Para no repetir el aviso de "ya casi llega" en cada vuelta del reloj.
  const avisadoRef = useRef(false);

  useEffect(() => {
    if (!pedidoId || !activo) return;

    let vivo = true;
    let reloj = null;
    anteriorRef.current = null;
    avisadoRef.current = false;

    const preguntar = async () => {
      try {
        const data = await orderService.getCourierPosition(pedidoId);
        if (!vivo) return;

        /*
         * Pedido cerrado, se deja de preguntar. Sin esto, la pestaña de
         * alguien que dejó la tienda abierta seguiría consultando cada diez
         * segundos toda la tarde por un pedido que ya recibió.
         */
        if (["entregado", "cancelado"].includes(data?.status)) {
          clearInterval(reloj);
        }

        const courier = data?.courier?.lat != null ? data.courier : null;

        /*
         * Velocidad medida: metros entre el punto anterior y este, divididos
         * por los segundos que pasaron. Solo cuenta si el punto es nuevo de
         * verdad — repetir la misma posición daría velocidad cero y una
         * espera infinita que no le sirve a nadie.
         */
        let velocidad = anteriorRef.current?.velocidad || null;
        const previo = anteriorRef.current;
        if (courier && previo?.updatedAt && previo.updatedAt !== courier.updatedAt) {
          const segundos = (new Date(courier.updatedAt) - new Date(previo.updatedAt)) / 1000;
          const metros = distanciaMetros(previo, courier);
          if (segundos > 0 && metros != null) velocidad = metros / segundos;
        }
        if (courier) anteriorRef.current = { ...courier, velocidad };

        /*
         * ── "Ya casi toca su puerta" ──
         * El aviso que de verdad importa. Mirar un puntito acercarse es
         * entretenido, pero lo que la gente quiere es que le digan CUÁNDO
         * levantarse: nadie se queda con el teléfono en la mano midiendo
         * cuadras.
         *
         * Una sola vez por pedido (el ref), y solo si el repartidor viene
         * llegando de verdad — sin destino guardado no hay contra qué medir.
         */
        if (courier && data?.destino && !avisadoRef.current) {
          const faltan = distanciaMetros(courier, data.destino);
          if (faltan != null && faltan <= YA_CASI_M) {
            avisadoRef.current = true;
            toast('Su pedido ya casi toca su puerta', {
              id: `ya-casi-${pedidoId}`,
              duration: 8000,
            });
            // Un tirón en el bolsillo, para quien no tenga la tienda a la vista.
            navigator.vibrate?.([120, 60, 120]);
          }
        }

        setDatos({
          id: pedidoId,
          // De paso viene el estado del pedido. Es gratis y arregla algo que
          // no funcionaba: la burbuja se quedaba en "Recibido" hasta que el
          // cliente recargara, aunque en la tienda ya lo estuvieran armando.
          status: data?.status || null,
          destino: data?.destino || null,
          courier,
          velocidad,
        });
      } catch {
        /*
         * Un fallo de red no borra lo que ya se sabía: se deja el último
         * punto y el reloj de abajo se encarga de enfriar la señal si esto se
         * repite. Parpadear el mapa en cada bache de señal se ve peor.
         */
      }
    };

    preguntar();
    reloj = setInterval(preguntar, CADA_CUANTO_MS);
    return () => { vivo = false; clearInterval(reloj); };
  }, [pedidoId, activo]);

  // Un tic aparte para que "hace 2 min" envejezca solo, sin esperar a que
  // llegue una posición nueva (que justamente puede que no llegue).
  useEffect(() => {
    if (!activo) return;
    const reloj = setInterval(() => setAhora(Date.now()), 15000);
    return () => clearInterval(reloj);
  }, [activo]);

  // ── Las cuentas ────────────────────────────────────────────
  // Lo del pedido anterior no cuenta: si el id no coincide, es basura vieja.
  const actual = activo && datos?.id === pedidoId ? datos : null;
  const courier = actual?.courier || null;

  const punto = courier?.lat != null && courier?.lng != null
    ? { lat: courier.lat, lng: courier.lng }
    : null;

  const desdeUltimoDato = courier?.updatedAt
    ? ahora - new Date(courier.updatedAt).getTime()
    : null;

  const senalFria = desdeUltimoDato != null && desdeUltimoDato > SENAL_FRIA_MS;

  const metrosFaltantes = punto && actual?.destino
    ? distanciaMetros(punto, actual.destino)
    : null;
  const minutos = minutosDeViaje(metrosFaltantes, actual?.velocidad);

  return {
    // Solo se considera "en vivo" si hay punto Y la señal está fresca.
    enVivo: !!punto && !senalFria,
    estado: actual?.status || null,
    punto,
    destino: actual?.destino || null,
    repartidor: courier?.name || '',
    senalFria,
    minutosDesdeUltimoDato: desdeUltimoDato != null ? Math.floor(desdeUltimoDato / 60000) : null,
    distancia: formatoDistancia(metrosFaltantes),
    espera: textoDeEspera(minutos),
    minutos,
    // Últimas dos cuadras: la UI lo usa para ponerse en modo "levántese ya".
    yaCasi: metrosFaltantes != null && metrosFaltantes <= YA_CASI_M,
  };
};
