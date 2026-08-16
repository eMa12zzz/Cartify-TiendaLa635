import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { areaDeRuta } from '../utils/sesion';

/*
 * ============================================================
 * DE QUÉ COLOR SALEN LOS AVISOS — useEstiloAvisos.js
 * ============================================================
 * El <Toaster> es UNO SOLO para toda la app —panel y tienda por igual—, pero
 * las dos mitades no se pintan con la misma paleta:
 *
 *   · La TIENDA usa el color de marca (--marca-*). Es la cara del negocio, y
 *     es fija y vive en index.css.
 *
 *   · El PANEL usa las paletas de accesibilidad (--theme-*). Alguien eligió
 *     "Alto Contraste" o "Modo Oscuro" porque las NECESITA para trabajar;
 *     meterle un aviso café encima de un fondo negro no es un descuido de
 *     estilo, es dejarlo sin leer lo que la aplicación le acaba de decir.
 *
 * Y eso era exactamente lo que pasaba: el aviso venía escrito a mano en
 * App.jsx, con el color y el borde clavados en el código. En el panel en modo
 * oscuro salía una tarjeta blanca con letra oscura en medio de una pantalla
 * negra, y el ✓ del éxito era del mismo color pasara lo que pasara.
 *
 * POR QUÉ VARIABLES Y NO COLORES CALCULADOS EN JS: react-hot-toast pinta sus
 * avisos en un portal colgado del <body>, pero las variables viven en :root y
 * de ahí bajan al body igual. No hace falta resolverlas a mano.
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
    duration: 3500,
    style: {
      background: enPanel ? 'var(--theme-card-bg)' : 'var(--papel)',
      color: enPanel ? 'var(--theme-text-primary)' : 'var(--tinta)',
      border: `1px solid ${enPanel ? 'var(--theme-card-border)' : 'var(--linea)'}`,
      borderRadius: 14,
      boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
      fontSize: 14,
      fontWeight: 500,
      padding: '12px 16px',
      maxWidth: 420,
    },
    success: {
      iconTheme: {
        primary: enPanel ? 'var(--theme-primary)' : 'var(--marca-600)',
        /*
         * El "secundario" es el palito del ✓, o sea el hueco que queda DENTRO
         * del círculo. Tiene que ser el fondo del aviso, no un blanco fijo: en
         * Alto Contraste el círculo es amarillo sobre negro, y un ✓ blanco
         * adentro se ve como un borrón.
         */
        secondary: enPanel ? 'var(--theme-card-bg)' : 'var(--papel)',
      },
    },
    error: {
      // El rojo NO cambia con la paleta: es un color de estado —peligro—, no
      // de marca. Que un error se vea igual en todos lados es la gracia.
      duration: 5000,
      iconTheme: {
        primary: 'var(--alerta)',
        secondary: enPanel ? 'var(--theme-card-bg)' : 'var(--papel)',
      },
    },
  }), [enPanel]);
};
