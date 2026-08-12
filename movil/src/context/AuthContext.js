/*
 * ============================================================
 * CONTEXTO DE AUTENTICACIÓN — AuthContext.js
 * ============================================================
 * El mismo contrato que `frontend/src/context/AuthContext.jsx`: expone
 * `user`, `token`, `login()`, `logout()`, `actualizarUsuario`, `esCliente` e
 * `isAuthenticated`.
 *
 * La web guarda la sesión en localStorage; aquí se guarda en AsyncStorage (una
 * llave con el token y los datos del usuario). Así la sesión SOBREVIVE al
 * cerrar la app: se entra una vez y al volver a abrir sigue dentro, igual que
 * en la web.
 * ============================================================
 */

import { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext(null);

const LLAVE = 'kartify:sesion';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al arrancar, se lee la sesión guardada (si la hay).
  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(LLAVE)
      .then((crudo) => {
        if (!vivo || !crudo) return;
        try {
          const s = JSON.parse(crudo);
          setToken(s.token || null);
          setUser(s.user || null);
        } catch { /* dato corrupto: se ignora */ }
      })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  // Guarda el token y los datos que devolvió el servidor al entrar (+ AsyncStorage).
  const login = useCallback((nuevoToken, tipoUsuario = 'client', datosUsuario = null) => {
    const u = { type: tipoUsuario, ...datosUsuario };
    setToken(nuevoToken);
    setUser(u);
    AsyncStorage.setItem(LLAVE, JSON.stringify({ token: nuevoToken, user: u })).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    AsyncStorage.removeItem(LLAVE).catch(() => {});
  }, []);

  /*
   * Parche parcial del usuario en sesión (ej. la foto de perfil). Refresca el
   * estado y lo persistido, para que el cambio sobreviva al reinicio.
   */
  const actualizarUsuario = useCallback((cambios) => {
    setUser((prev) => {
      if (!prev) return prev;
      const u = { ...prev, ...cambios };
      AsyncStorage.setItem(LLAVE, JSON.stringify({ token, user: u })).catch(() => {});
      return u;
    });
  }, [token]);

  const valor = useMemo(
    () => ({
      user,
      token,
      cargando,
      login,
      logout,
      actualizarUsuario,
      isAuthenticated: !!token,
      // ¿La sesión es de un CLIENTE (y no del personal)? Las pantallas de
      // "Mi Cuenta" piden datos a /client/:id, que solo conoce clientes.
      esCliente: user?.type === 'client' && !!user?.id,
    }),
    [user, token, cargando, login, logout, actualizarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
