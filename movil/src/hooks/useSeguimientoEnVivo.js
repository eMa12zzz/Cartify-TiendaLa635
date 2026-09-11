import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { getCourierPosition } from '../api/pedidosApi';
import { useAviso } from '../context/AvisoContext';
import { distanciaMetros, minutosDeViaje, textoDeEspera, formatoDistancia } from '../utils/geo';

/*
 * ============================================================
 * SEGUIMIENTO EN VIVO — useSeguimientoEnVivo.js
 * ============================================================
 * Copia de `frontend/src/hooks/useSeguimientoEnVivo.js`: preguntar cada
 * pocos segundos dónde va el repartidor y traducirlo a algo que se entienda
 * ("llega en 10 min aprox."). Mismo por qué preguntar y no un socket: el
 * backend es Express pelado, y una consulta cada 10 segundos a una ruta que
 * devuelve cuatro números sale más barato que sumar un servidor de sockets.
 *
 * Dos diferencias con la web, las dos porque el navegador y el teléfono no
 * tienen las mismas herramientas:
 *   - El aviso de "ya casi llega" usa useAviso (ver AvisoContext) en vez de
 *     react-hot-toast.
 *   - El tirón en el bolsillo usa `Vibration` de react-native en vez de
 *     `navigator.vibrate`.
 * ============================================================
 */

const CADA_CUANTO_MS = 10000;      // se pregunta cada 10 segundos
const SENAL_FRIA_MS = 90000;       // sin noticias en minuto y medio: se avisa
const YA_CASI_M = 250;             // dos cuadras: el punto de levantarse

export const useSeguimientoEnVivo = (pedidoId, activo = true) => {
  const { avisar } = useAviso();
  const [datos, setDatos] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  const anteriorRef = useRef(null);
  const avisadoRef = useRef(false);

  useEffect(() => {
    if (!pedidoId || !activo) return;

    let vivo = true;
    let reloj = null;
    anteriorRef.current = null;
    avisadoRef.current = false;

    const preguntar = async () => {
      try {
        const data = await getCourierPosition(pedidoId);
        if (!vivo) return;

        // Pedido cerrado, se deja de preguntar.
        if (['entregado', 'cancelado'].includes(data?.status)) {
          clearInterval(reloj);
        }

        const courier = data?.courier?.lat != null ? data.courier : null;

        let velocidad = anteriorRef.current?.velocidad || null;
        const previo = anteriorRef.current;
        if (courier && previo?.updatedAt && previo.updatedAt !== courier.updatedAt) {
          const segundos = (new Date(courier.updatedAt) - new Date(previo.updatedAt)) / 1000;
          const metros = distanciaMetros(previo, courier);
          if (segundos > 0 && metros != null) velocidad = metros / segundos;
        }
        if (courier) anteriorRef.current = { ...courier, velocidad };

        // "Ya casi toca su puerta" — una sola vez por pedido.
        if (courier && data?.destino && !avisadoRef.current) {
          const faltan = distanciaMetros(courier, data.destino);
          if (faltan != null && faltan <= YA_CASI_M) {
            avisadoRef.current = true;
            avisar('Su pedido ya casi toca su puerta');
            Vibration.vibrate([120, 60, 120]);
          }
        }

        setDatos({
          id: pedidoId,
          status: data?.status || null,
          destino: data?.destino || null,
          courier,
          velocidad,
        });
      } catch {
        // Un fallo de red no borra lo que ya se sabía.
      }
    };

    preguntar();
    reloj = setInterval(preguntar, CADA_CUANTO_MS);
    return () => { vivo = false; clearInterval(reloj); };
  }, [pedidoId, activo, avisar]);

  // Un tic aparte para que "hace 2 min" envejezca solo.
  useEffect(() => {
    if (!activo) return;
    const reloj = setInterval(() => setAhora(Date.now()), 15000);
    return () => clearInterval(reloj);
  }, [activo]);

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
    yaCasi: metrosFaltantes != null && metrosFaltantes <= YA_CASI_M,
  };
};

export default useSeguimientoEnVivo;
