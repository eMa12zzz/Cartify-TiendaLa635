/*
 * useSplashTimer — cuánto se queda la pantalla de carga personalizada.
 *
 * El splash nativo (app.json) ya se fue en cuanto el JS arrancó. Esta pantalla
 * es la que se ve MIENTRAS se revisa si hay sesión guardada, y se queda un
 * mínimo de tiempo aunque esa revisión sea instantánea — sin el mínimo, en un
 * teléfono rápido parpadea y desaparece antes de poder leerse.
 */

import { useEffect, useState } from 'react';

const DURACION_MINIMA = 1400;

export const useSplashTimer = (cargando) => {
  const [mostrar, setMostrar] = useState(true);

  useEffect(() => {
    if (cargando) return undefined;

    const id = setTimeout(() => setMostrar(false), DURACION_MINIMA);
    return () => clearTimeout(id);
  }, [cargando]);

  return mostrar || cargando;
};

export default useSplashTimer;
