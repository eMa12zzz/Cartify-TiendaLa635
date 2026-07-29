import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../api/orderService';
import { useAuth } from './useAuth';
import { distanciaMetros } from '../utils/geo';

/*
 * ============================================================
 * VIAJE EN VIVO — useViajeEnVivo.js
 * ============================================================
 * El lado del repartidor: su teléfono cuenta dónde va mientras lleva los
 * pedidos, para que el cliente vea el puntito avanzar.
 *
 * Tres decisiones que vale la pena explicar:
 *
 * 1. VARIOS PEDIDOS A LA VEZ. Nadie sale a repartir un solo pedido: se hace
 *    una vuelta con tres o cuatro. El GPS es uno solo, así que se lee una vez
 *    y la misma posición se le manda a todos los pedidos del viaje.
 *
 * 2. LA PANTALLA NO SE DUERME. Este es el punto flojo de hacerlo en web y no
 *    en app nativa: si el teléfono se bloquea, el navegador congela el envío
 *    y el puntito se queda pegado. Con Wake Lock la pantalla se mantiene
 *    encendida mientras dura el viaje, que es lo más cerca que se puede
 *    llegar sin publicar una app.
 *
 * 3. NO SE MANDA TODO. El GPS dispara muchísimas veces por minuto. Se envía
 *    cuando pasaron 10 segundos Y se movió al menos 15 metros — quieto en un
 *    semáforo no hay nada nuevo que contar, y cada envío gasta batería y
 *    datos de alguien que anda en la calle.
 * ============================================================
 */

const CADA_CUANTO_MS = 10000;   // no más de un envío cada 10 segundos
const MOVIMIENTO_MINIMO_M = 15; // ni por moverse menos de 15 metros
const GUARDADO = 'kartify:viaje-en-vivo';

export const useViajeEnVivo = () => {
  const { user } = useAuth();

  // Los pedidos que van en esta vuelta.
  const [enViaje, setEnViaje] = useState([]);
  const [posicion, setPosicion] = useState(null);
  const [error, setError] = useState('');
  const [pantallaDespierta, setPantallaDespierta] = useState(false);

  /*
   * Refs y no estado: el callback del GPS lo registra el navegador una sola
   * vez y se queda con la versión de las variables que existía en ese
   * momento. Con estado leería siempre la lista vacía del principio.
   */
  const watchRef = useRef(null);
  const wakeLockRef = useRef(null);
  const enViajeRef = useRef([]);
  const ultimoEnvioRef = useRef({ t: 0, punto: null });

  const quien = user?.fullName || user?.userName || '';

  // ── Wake Lock ──────────────────────────────────────────────
  const despertarPantalla = useCallback(async () => {
    if (!('wakeLock' in navigator)) return; // Safari viejo y escritorio: ni modo
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setPantallaDespierta(true);
      // Si se suelta solo (el sistema a veces lo quita), que la UI se entere.
      wakeLockRef.current.addEventListener('release', () => setPantallaDespierta(false));
    } catch {
      setPantallaDespierta(false);
    }
  }, []);

  const soltarPantalla = useCallback(async () => {
    try { await wakeLockRef.current?.release(); } catch { /* ya estaba suelto */ }
    wakeLockRef.current = null;
    setPantallaDespierta(false);
  }, []);

  // ── Envío de la posición ───────────────────────────────────
  const enviar = useCallback(async (coords, forzado = false) => {
    const ids = enViajeRef.current;
    if (!ids.length) return;

    const ahora = Date.now();
    const { t, punto } = ultimoEnvioRef.current;
    const movido = punto ? distanciaMetros(punto, coords) : Infinity;

    if (!forzado) {
      if (ahora - t < CADA_CUANTO_MS) return;
      if (movido < MOVIMIENTO_MINIMO_M) return;
    }

    ultimoEnvioRef.current = { t: ahora, punto: coords };

    /*
     * A todos los pedidos de la vuelta, en paralelo. allSettled y no all: si
     * uno falla (se canceló, se cayó la señal a la mitad), los demás igual
     * tienen que recibir su posición.
     */
    await Promise.allSettled(
      ids.map((id) =>
        orderService.updateCourierPosition(id, {
          lat: coords.lat,
          lng: coords.lng,
          quien,
        })
      )
    );
  }, [quien]);

  // ── El GPS ─────────────────────────────────────────────────
  const encenderGPS = useCallback(() => {
    if (watchRef.current != null) return; // ya está prendido
    if (!navigator.geolocation) {
      setError('Este teléfono no permite compartir la ubicación');
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setError('');
        const punto = { lat: coords.latitude, lng: coords.longitude };
        setPosicion(punto);
        enviar(punto);
      },
      (e) => {
        const mensajes = {
          1: 'No nos dio permiso de usar su ubicación. Actívela para compartir el viaje.',
          2: 'No se pudo leer su ubicación. Revise que el GPS esté encendido.',
          3: 'La ubicación está tardando. Puede que tenga mala señal.',
        };
        setError(mensajes[e.code] || 'No se pudo leer su ubicación');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, [enviar]);

  const apagarGPS = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    ultimoEnvioRef.current = { t: 0, punto: null };
    setPosicion(null);
  }, []);

  // ── Sumar y quitar pedidos del viaje ───────────────────────
  const sumarAlViaje = useCallback((pedidoId) => {
    const id = String(pedidoId);
    if (enViajeRef.current.includes(id)) return;

    enViajeRef.current = [...enViajeRef.current, id];
    setEnViaje(enViajeRef.current);
    localStorage.setItem(GUARDADO, JSON.stringify(enViajeRef.current));
    encenderGPS();

    /*
     * Si el GPS ya venía leyendo, el pedido recién sumado no tiene por qué
     * esperar el próximo ciclo para aparecer en el mapa del cliente.
     */
    if (posicion) enviar(posicion, true);
  }, [encenderGPS, enviar, posicion]);

  const quitarDelViaje = useCallback(async (pedidoId) => {
    const id = String(pedidoId);
    enViajeRef.current = enViajeRef.current.filter((x) => x !== id);
    setEnViaje(enViajeRef.current);
    localStorage.setItem(GUARDADO, JSON.stringify(enViajeRef.current));

    // Que al cliente se le apague el puntito, no que se le quede congelado.
    try {
      await orderService.updateCourierPosition(id, { activo: false });
    } catch {
      /* si no se pudo avisar, el punto se limpia solo al entregar */
    }

    // Sin pedidos que seguir, no hay razón para tener el GPS ni la pantalla
    // encendidos gastándole la batería a alguien que va manejando.
    if (!enViajeRef.current.length) {
      apagarGPS();
      soltarPantalla();
    }
  }, [apagarGPS, soltarPantalla]);

  const vaEnViaje = useCallback((pedidoId) => enViaje.includes(String(pedidoId)), [enViaje]);

  // ── Reanudar tras recargar ─────────────────────────────────
  /*
   * Un repartidor que refresca sin querer, o al que se le recarga la página
   * al volver a la pestaña, no debería perder el viaje: los ids quedan
   * guardados en el teléfono y se retoma solo.
   */
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(GUARDADO) || '[]');
      if (Array.isArray(guardado) && guardado.length) {
        enViajeRef.current = guardado.map(String);
        setEnViaje(enViajeRef.current);
        encenderGPS();
        despertarPantalla();
        toast('Se retomó el viaje en curso', { id: 'viaje-retomado' });
      }
    } catch {
      localStorage.removeItem(GUARDADO);
    }
    // Solo al montar: reanudar una vez, no en cada cambio de dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El Wake Lock se cae solo cuando la pestaña pasa a segundo plano; al
  // volver hay que pedirlo de nuevo o la pantalla se apaga a media entrega.
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && enViajeRef.current.length) {
        despertarPantalla();
      }
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [despertarPantalla]);

  // Al salir de la pantalla se suelta el GPS. Los ids quedan guardados, así
  // que el viaje se retoma al volver.
  useEffect(() => () => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    wakeLockRef.current?.release?.().catch(() => {});
  }, []);

  /*
   * Empezar a compartir: el primer pedido enciende el GPS y la pantalla.
   * El Wake Lock se pide aquí, en respuesta al toque, porque el navegador
   * solo lo concede si viene de un gesto de la persona.
   */
  const empezarViaje = useCallback((pedidoId) => {
    sumarAlViaje(pedidoId);
    despertarPantalla();
  }, [sumarAlViaje, despertarPantalla]);

  return {
    enViaje,
    posicion,
    error,
    pantallaDespierta,
    vaEnViaje,
    empezarViaje,
    quitarDelViaje,
  };
};
