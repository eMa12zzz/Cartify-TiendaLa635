import { useCallback, useEffect, useMemo, useState } from 'react';
import { IdiomaContexto } from '../hooks/useIdioma';
import {
  LLAVE_IDIOMA, guardarIdioma, leerIdiomaGuardado, localeDe, traducir, esIdiomaValido,
} from '../utils/idioma';

/*
 * IdiomaProvider — el idioma elegido, para toda la tienda. Ver utils/idioma.js.
 *
 * Además de dar `t`, pone el idioma en <html lang>: el lector de pantalla lee
 * con la voz de ese idioma, y el navegador no ofrece "traducir esta página"
 * sobre una página que ya está en inglés.
 */
export const IdiomaProvider = ({ children }) => {
  const [idioma, setIdiomaEstado] = useState(leerIdiomaGuardado);

  const setIdioma = useCallback((nuevo) => {
    if (!esIdiomaValido(nuevo)) return;
    guardarIdioma(nuevo);
    setIdiomaEstado(nuevo);
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  // Otra pestaña cambió el idioma: esta lo sigue.
  useEffect(() => {
    const alCambiar = (e) => {
      if (e.key === LLAVE_IDIOMA || e.key === null) setIdiomaEstado(leerIdiomaGuardado());
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const t = useCallback((texto, vars) => traducir(idioma, texto, vars), [idioma]);
  const valor = useMemo(() => ({ idioma, setIdioma, t, locale: localeDe(idioma) }), [idioma, setIdioma, t]);

  return <IdiomaContexto.Provider value={valor}>{children}</IdiomaContexto.Provider>;
};
