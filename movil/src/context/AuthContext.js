/*
 * ============================================================
 * CONTEXTO DE AUTENTICACIÓN — AuthContext.js
 * ============================================================
 * El mismo contrato que `frontend/src/context/AuthContext.jsx`: expone
 * `user`, `token`, `login()`, `logout()` e `isAuthenticated`, para que quien
 * venga de la web encuentre lo que espera.
 *
 * La diferencia está en dónde vive la sesión. La web la guarda en
 * localStorage, que en React Native no existe. Su reemplazo natural es
 * expo-secure-store (o AsyncStorage), y ninguno está instalado.
 *
 * Así que por ahora la sesión vive en memoria: se entra bien, se navega bien y
 * se cierra bien, pero al matar la app hay que volver a entrar. Es una línea
 * de código el día que se agregue el paquete —guardar y leer en `login` y en
 * el efecto de arranque— y se prefiere eso antes que meter una dependencia a
 * escondidas.
 * ============================================================
 */

import { createContext, useCallback, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Guarda el token y los datos que devolvió el servidor al entrar.
  const login = useCallback((nuevoToken, tipoUsuario = 'client', datosUsuario = null) => {
    setToken(nuevoToken);
    setUser({ type: tipoUsuario, ...datosUsuario });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const valor = useMemo(
    () => ({ user, token, login, logout, isAuthenticated: !!token }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
