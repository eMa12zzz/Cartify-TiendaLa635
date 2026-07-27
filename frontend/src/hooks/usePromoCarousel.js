import { useState, useEffect, useCallback, useRef } from 'react';
import { promotionService } from '../api/promotionService';
import { promosVisibles } from '../utils/promos';

/*
 * usePromoCarousel — el cerebro del carrusel 3D de promociones.
 *
 * Trae las promos que se anuncian, lleva cuál está al centro, avanza sola y
 * calcula la posición de cada tarjeta en el anillo. La vista solo pinta.
 *
 * El giro es circular: desde la última se sigue a la primera sin saltos.
 */
const INTERVALO = 5000; // cada cuánto avanza sola

/*
 * Cuántas promos entran al carrusel. Con más de tres el cliente deja de
 * mirarlas: el carrusel se vuelve papel tapiz. Si hay más promociones activas
 * igual aplican su descuento en los precios — lo que se limita es el anuncio,
 * no la promo.
 */
const MAXIMO = 3;

export const usePromoCarousel = ({ autoplay = true } = {}) => {
  const [promos, setPromos] = useState([]);
  const [activa, setActiva] = useState(0);
  const [pausada, setPausada] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => {
    let vivo = true;
    promotionService.getPromotions()
      // Las más nuevas primero: si la tienda arma una promo hoy, quiere que
      // se vea, no que quede detrás de una de hace tres meses.
      .then((d) => {
        if (!vivo) return;
        const visibles = promosVisibles(d)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, MAXIMO);
        setPromos(visibles);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  const total = promos.length;

  const irA = useCallback((i) => {
    if (total === 0) return;
    // Módulo que también funciona con negativos.
    setActiva(((i % total) + total) % total);
  }, [total]);

  const siguiente = useCallback(() => irA(activa + 1), [irA, activa]);
  const anterior = useCallback(() => irA(activa - 1), [irA, activa]);

  // Avance automático. Se detiene con el mouse encima o si solo hay una promo.
  useEffect(() => {
    clearInterval(temporizador.current);
    if (!autoplay || pausada || total < 2) return undefined;
    temporizador.current = setInterval(() => {
      setActiva((i) => (i + 1) % total);
    }, INTERVALO);
    return () => clearInterval(temporizador.current);
  }, [autoplay, pausada, total]);

  // Si se borra una promo y el índice queda fuera de rango, lo acomodamos.
  useEffect(() => {
    if (total > 0 && activa >= total) setActiva(0);
  }, [total, activa]);

  /*
   * Distancia de una tarjeta respecto al centro, por el camino más corto.
   * Con 5 promos y la 0 activa, la 4 está a -1 (no a +4): así el anillo gira
   * para el lado que menos se mueve y nunca pega un salto raro.
   */
  const distancia = useCallback((i) => {
    if (total === 0) return 0;
    let d = i - activa;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  }, [activa, total]);

  return {
    promos,
    activa,
    total,
    irA,
    siguiente,
    anterior,
    distancia,
    pausar: () => setPausada(true),
    reanudar: () => setPausada(false),
  };
};
