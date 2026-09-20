/*
 * ============================================================
 * MODO — claro u oscuro, para toda la app
 * ============================================================
 * Lo que en la web hace `ModoContext` + el `data-modo` del <html>. Lo elige la
 * persona en Mi cuenta → Preferencias y se guarda en el teléfono (ver
 * utils/modo.js).
 *
 * ── Por qué los estilos se piden y no se importan ──
 *
 * En la web, cambiar `data-modo` repinta todo porque el CSS ya estaba leyendo
 * las variables. Aquí `StyleSheet.create` se evalúa UNA vez, al importar el
 * archivo, y un color escrito ahí queda congelado — el mismo problema que
 * explica TemaContext con la temporada.
 *
 * Así que cada pantalla escribe sus estilos como una función de la paleta:
 *
 *     const crearEstilos = (COLORES) => StyleSheet.create({ ... });
 *     ...
 *     const estilos = useEstilos(crearEstilos);
 *
 * y `useEstilos` le da la hoja del modo que rige. Se arma a lo sumo dos veces
 * por archivo en toda la vida de la app (una clara, una oscura) y se guarda:
 * StyleSheet sigue siendo lo que era, una hoja que no se rehace en cada render.
 * El parámetro se llama COLORES a propósito, igual que la paleta de antes:
 * adentro de la hoja nada cambió de nombre, solo de dónde sale.
 *
 * Para un color suelto (el de un icono, el de un ActivityIndicator),
 * `useColores()`.
 *
 * ── También lo nativo ──
 *
 * `Appearance.setColorScheme` le dice al sistema qué modo eligió la persona:
 * así las alertas de "¿Cerrar sesión?" y los selectores del sistema salen del
 * mismo color que la app, y no blancos en medio de una pantalla oscura. En
 * 'sistema' se le devuelve el control al teléfono.
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { COLORES_CLARO, COLORES_OSCURO } from '../theme/colores';
import { MODOS, esOscuro, guardarModo, leerModoGuardado } from '../utils/modo';

const ModoContext = createContext(null);

const ESQUEMA_NATIVO = { claro: 'light', oscuro: 'dark', sistema: 'unspecified' };

export const ModoProvider = ({ children }) => {
  // null mientras se lee el almacén: un 'claro' de arranque pintaría la app
  // blanca un instante a quien eligió oscuro.
  const [modo, setModoEstado] = useState(null);
  const esquema = useColorScheme();

  useEffect(() => {
    let vivo = true;
    leerModoGuardado().then((guardado) => vivo && setModoEstado(guardado));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!modo) return;
    try {
      Appearance.setColorScheme(ESQUEMA_NATIVO[modo]);
    } catch {
      // En web no hay a quién decirle: la app se pinta igual.
    }
  }, [modo]);

  const setModo = useCallback((nuevo) => {
    if (!MODOS.includes(nuevo)) return;
    guardarModo(nuevo);
    setModoEstado(nuevo);
  }, []);

  const oscuro = esOscuro(modo, esquema);

  const valor = useMemo(
    () => ({ modo, setModo, oscuro, colores: oscuro ? COLORES_OSCURO : COLORES_CLARO }),
    [modo, setModo, oscuro]
  );

  // Es una lectura del almacén del teléfono: milisegundos, no una pantalla de carga.
  if (!modo) return null;

  return <ModoContext.Provider value={valor}>{children}</ModoContext.Provider>;
};

const SIN_PROVEEDOR = { modo: 'claro', setModo: () => {}, oscuro: false, colores: COLORES_CLARO };

export const useModo = () => useContext(ModoContext) || SIN_PROVEEDOR;

// La paleta neutra del modo que rige. La de marca (temporada) sigue en useTema().
export const useColores = () => useModo().colores;

/*
 * Una hoja por archivo y por modo, guardada con la función que la arma como
 * llave. Las funciones `crearEstilos` viven fuera de los componentes, así que
 * son siempre la misma y la hoja se reusa entre renders y entre pantallas.
 */
const hojas = new WeakMap();

export const useEstilos = (crear) => {
  const { oscuro, colores } = useModo();
  let par = hojas.get(crear);
  if (!par) {
    par = {};
    hojas.set(crear, par);
  }
  const clave = oscuro ? 'oscuro' : 'claro';
  if (!par[clave]) par[clave] = crear(colores);
  return par[clave];
};
