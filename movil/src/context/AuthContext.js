/*
 * ============================================================
 * CONTEXTO DE AUTENTICACIÓN — AuthContext.js
 * ============================================================
 * El mismo contrato que `frontend/src/context/AuthContext.jsx`: expone
 * `user`, `token`, `login()`, `logout()` e `isAuthenticated`, para que quien
 * venga de la web encuentre lo que espera.
 *
 * La sesión ya no vive solo en memoria. La web la guarda en localStorage, que
 * en React Native no existe; aquí se guarda con expo-secure-store, que en
 * Android va al KeyStore y en iOS al Keychain — que es donde va un token, no
 * en un archivo de texto al lado de la app. Ver utils/almacen.js.
 *
 * ── El `cargando` no es un detalle ──
 *
 * Leer del almacén es asíncrono, así que en el primer render todavía no se
 * sabe si hay sesión. Sin ese estado, la app pintaba el login durante un
 * parpadeo y saltaba a la tienda: quien ya había entrado veía la pantalla de
 * entrar durante un instante en cada arranque, que es justo lo que guardar la
 * sesión venía a evitar.
 * ============================================================
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { borrar, guardar, leer, llave } from '../utils/almacen';

export const AuthContext = createContext(null);

const LLAVE_SESION = llave('cartify', 'sesion');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Arranca en true: hasta no haber mirado el almacén no se sabe nada.
  const [cargando, setCargando] = useState(true);

  // Al abrir la app: recuperar la sesión de la vez pasada, si la hubo.
  useEffect(() => {
    let vivo = true;

    (async () => {
      const crudo = await leer(LLAVE_SESION);
      if (!vivo) return;

      try {
        const datos = JSON.parse(crudo || 'null');
        // Sin token no hay sesión que restaurar, por más que haya un `user`
        // guardado: es el token lo que el backend va a pedir.
        if (datos?.token) {
          setToken(datos.token);
          setUser(datos.user || null);
        }
      } catch {
        /*
         * Guardado ilegible (una versión vieja de la app, un valor a medio
         * escribir). Se entra sin sesión, que es la salida segura: lo peor
         * sería arrancar con media sesión y fallar en la primera petición.
         */
      }

      setCargando(false);
    })();

    return () => {
      vivo = false;
    };
  }, []);

  // Guarda el token y los datos que devolvió el servidor al entrar.
  const login = useCallback((nuevoToken, tipoUsuario = 'client', datosUsuario = null) => {
    const nuevoUsuario = { type: tipoUsuario, ...datosUsuario };
    setToken(nuevoToken);
    setUser(nuevoUsuario);
    /*
     * Sin await: la pantalla no tiene por qué esperar al disco para dejar
     * entrar. Si la escritura falla —almacén lleno, dispositivo sin caja
     * fuerte— la sesión igual funciona toda esta corrida; lo único que se
     * pierde es no tener que volver a entrar mañana.
     */
    guardar(LLAVE_SESION, JSON.stringify({ token: nuevoToken, user: nuevoUsuario }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    borrar(LLAVE_SESION);
  }, []);

  const valor = useMemo(
    () => ({ user, token, login, logout, isAuthenticated: !!token, cargando }),
    [user, token, login, logout, cargando]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
