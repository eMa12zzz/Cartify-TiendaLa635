import { useRef, useState, useEffect, useCallback } from 'react';

/*
 * useFilaDeslizable — para las filas de productos que se corren de lado con las
 * flechas circulares del diseño.
 *
 * Lleva la cuenta de si todavía se puede ir a la izquierda o a la derecha, para
 * apagar la flecha que ya no sirve en vez de dejarla puesta sin hacer nada.
 */
export const useFilaDeslizable = () => {
  const fila = useRef(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const revisar = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    // 2px de tolerancia: los navegadores redondean distinto el scroll y sin
    // esto la flecha derecha se queda encendida al llegar al final.
    setPuedeIzq(el.scrollLeft > 2);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = fila.current;
    if (!el) return undefined;
    revisar();
    el.addEventListener('scroll', revisar, { passive: true });
    // Si cambia el ancho (o llegan más productos) hay que recalcular.
    const observador = new ResizeObserver(revisar);
    observador.observe(el);
    return () => {
      el.removeEventListener('scroll', revisar);
      observador.disconnect();
    };
  }, [revisar]);

  // Corre casi una pantalla, dejando un pedacito visible para no perder el hilo.
  const mover = (direccion) => {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return { fila, puedeIzq, puedeDer, izquierda: () => mover(-1), derecha: () => mover(1) };
};
