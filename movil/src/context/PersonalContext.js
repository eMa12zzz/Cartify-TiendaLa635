/*
 * ============================================================
 * EL PERSONAL EN EL TELÉFONO — PersonalContext.js
 * ============================================================
 * Quien trabaja en la tienda entra desde la app por "¿Trabajas en la
 * tienda?" (pages/personal/LoginPersonal.js), y la app deja de ser la tienda:
 * pasa a ser su herramienta de trabajo (pages/personal/ModoPersonal.js).
 *
 *   - El administrador ve a Tiqui del panel (le pregunta cómo va el negocio y
 *     le pide cambios) y el Reparto.
 *   - El empleado ve solo el Reparto.
 *
 * Es lo que antes era "Estoy trabajando" en Mi cuenta de la web, que mezclaba
 * la sesión de cliente con la de personal de la misma persona. Aquí cada una
 * va aparte: esta sesión vive en su propia llave del almacén seguro y nunca se
 * instala como el token de la tienda (ver personalApi). App.js elige entre la
 * tienda y el modo personal según haya o no esta sesión.
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { borrar, guardar, leer, llave } from '../utils/almacen';
import { personalApi } from '../api/personalApi';

const PersonalContext = createContext(null);
const LLAVE_SESION = llave('cartify', 'sesion-personal');
// La del modo administrador de antes, que solo dejaba entrar al dueño.
const LLAVE_VIEJA = llave('cartify', 'sesion-admin');

export const PersonalProvider = ({ children }) => {
  const [sesion, setSesion] = useState(null); // { token, tipo: 'admin'|'employee', nombre, email }
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      let crudo = await leer(LLAVE_SESION);
      /*
       * Mudanza: quien ya había entrado con el modo administrador no tiene por
       * qué volver a poner su contraseña y su código. Esa sesión era de
       * administrador por fuerza (era lo único que dejaba entrar).
       */
      if (!crudo) {
        const vieja = await leer(LLAVE_VIEJA);
        if (vieja) {
          try {
            crudo = JSON.stringify({ tipo: 'admin', ...JSON.parse(vieja) });
            await guardar(LLAVE_SESION, crudo);
          } catch { /* ilegible: se descarta */ }
          borrar(LLAVE_VIEJA);
        }
      }
      if (!vivo) return;
      try {
        const datos = JSON.parse(crudo || 'null');
        if (datos?.token) setSesion(datos);
      } catch {
        // Ilegible: como si no hubiera sesión.
      }
      setCargando(false);
    })();
    return () => { vivo = false; };
  }, []);

  const iniciar = useCallback((datos) => {
    setSesion(datos);
    guardar(LLAVE_SESION, JSON.stringify(datos));
  }, []);

  const salir = useCallback(() => {
    setSesion(null);
    borrar(LLAVE_SESION);
    personalApi.salir();
  }, []);

  const valor = useMemo(() => ({
    sesion,
    cargando,
    esAdmin: sesion?.tipo === 'admin',
    iniciar,
    salir,
  }), [sesion, cargando, iniciar, salir]);

  return <PersonalContext.Provider value={valor}>{children}</PersonalContext.Provider>;
};

export const usePersonal = () => {
  const ctx = useContext(PersonalContext);
  if (!ctx) throw new Error('usePersonal debe usarse dentro de <PersonalProvider>');
  return ctx;
};
