import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { areaDeRuta } from '../utils/sesion';

/*
 * ============================================================
 * DE QUÉ COLOR SALEN LOS AVISOS — useEstiloAvisos.js
 * ============================================================
 * Todos los avisos son la misma píldora (components/UI/PildoraAviso.jsx),
 * pero el <Toaster> es UNO SOLO para toda la app —panel y tienda por igual— y
 * las dos mitades no se pintan con la misma paleta:
 *
 *   · La TIENDA usa la tinta de la marca: píldora oscura con letra blanca, y
 *     en modo oscuro al revés, porque --tinta y --sobre-tinta ya se voltean
 *     solas (index.css).
 *
 *   · El PANEL usa las paletas de accesibilidad (--theme-*), también al revés:
 *     el fondo de la píldora es el color del texto y la letra, el de las
 *     tarjetas. Alguien eligió "Alto Contraste" o "Modo Oscuro" porque las
 *     NECESITA para trabajar; en Alto Contraste la píldora sale blanca con
 *     letra negra sobre la pantalla negra, en vez de un borrón oscuro que no
 *     se distingue del fondo.
 *
 * POR QUÉ VARIABLES Y NO COLORES CALCULADOS EN JS: react-hot-toast pinta sus
 * avisos en un portal colgado del <body>, pero las variables viven en :root y
 * de ahí bajan igual. Aquí solo se dice CUÁLES usar, en --aviso-fondo y
 * --aviso-texto sobre el contenedor de los avisos; la píldora las lee de ahí.
 *
 * La frontera entre panel y tienda no se vuelve a escribir aquí: es la misma
 * de utils/sesion.js, la que decide también qué sesión manda en cada ruta. Una
 * ruta nueva del panel se agrega ALLÁ y esto la sigue solo.
 * ============================================================
 */

export const useEstiloAvisos = () => {
  const { pathname } = useLocation();
  const enPanel = areaDeRuta(pathname) === 'personal';

  return useMemo(() => ({
    colores: enPanel
      ? { '--aviso-fondo': 'var(--theme-text-primary, #1C1614)', '--aviso-texto': 'var(--theme-card-bg, #fff)' }
      : { '--aviso-fondo': 'var(--tinta, #1C1614)', '--aviso-texto': 'var(--sobre-tinta, #fff)' },
    opciones: {
      duration: 3500,
      // Un error se queda más: hay que leerlo y decidir qué hacer.
      error: { duration: 5000 },
    },
  }), [enPanel]);
};
