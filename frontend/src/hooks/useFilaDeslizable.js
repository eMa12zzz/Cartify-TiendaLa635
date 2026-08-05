import { useRef, useState, useCallback, useEffect } from 'react';

/*
 * useFilaDeslizable — para las filas de productos que se corren de lado con las
 * flechas circulares del diseño.
 *
 * Lleva la cuenta de si todavía se puede ir a la izquierda o a la derecha, para
 * apagar la flecha que ya no sirve en vez de dejarla puesta sin hacer nada.
 *
 * OJO CON EL ENGANCHE, que es lo que costó: `fila` es una función, no un
 * objeto ref. React la llama con el nodo cuando aparece y con null cuando se
 * va, y ese es justo el momento en que hay que medir.
 *
 * Antes era un useRef con un useEffect de montaje, y no funcionaba: la fila
 * solo se pinta cuando ya hay productos, y los productos llegan del servidor
 * DESPUÉS del primer render. Al correr el efecto, `fila.current` era null, se
 * salía sin enganchar nada, y como sus dependencias nunca cambiaban no volvía
 * a intentarlo. Resultado: las flechas de "Más vendidos" nacían apagadas y no
 * se encendían jamás.
 */
/*
 * Cuánto scroll se considera "nada".
 *
 * Eran 2px, pensados solo para el redondeo del navegador. Pero estas filas
 * llevan 16px de relleno lateral —el que evita que se corten las sombras de la
 * primera y la última tarjeta— y eso deja unos diez píxeles de recorrido que
 * no son contenido: con 2px de tolerancia la flecha izquierda nacía encendida
 * en una fila que nadie había tocado, y al pulsarla no pasaba nada visible.
 * 18 cubre el relleno y el redondeo.
 */
const TOLERANCIA = 18;

export const useFilaDeslizable = () => {
  const nodo = useRef(null);
  const limpiar = useRef(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const revisar = useCallback(() => {
    const el = nodo.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > TOLERANCIA);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - TOLERANCIA);
  }, []);

  /*
   * El enganche. Se mide EN CUANTO el nodo existe, sin esperar a ningún
   * efecto, y se suelta todo cuando se va.
   */
  const fila = useCallback((el) => {
    // Al reemplazarse o desmontarse, primero se suelta lo anterior.
    if (limpiar.current) {
      limpiar.current();
      limpiar.current = null;
    }

    nodo.current = el;
    if (!el) {
      // Sin fila no hay a dónde correrse: las flechas se apagan.
      setPuedeIzq(false);
      setPuedeDer(false);
      return;
    }

    revisar();
    el.addEventListener('scroll', revisar, { passive: true });
    // Si cambia el ancho (o llegan más productos) hay que recalcular.
    const observador = new ResizeObserver(revisar);
    observador.observe(el);

    limpiar.current = () => {
      el.removeEventListener('scroll', revisar);
      observador.disconnect();
    };
  }, [revisar]);

  // Red de seguridad: si el componente se va sin que React llame al ref con
  // null (no debería pasar, pero el observer sobreviviría a la fila).
  useEffect(() => () => { if (limpiar.current) limpiar.current(); }, []);

  // Corre casi una pantalla, dejando un pedacito visible para no perder el hilo.
  const mover = (direccion) => {
    const el = nodo.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return { fila, puedeIzq, puedeDer, izquierda: () => mover(-1), derecha: () => mover(1) };
};
