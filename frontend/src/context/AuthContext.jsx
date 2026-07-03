import { createContext, useState, useEffect, useCallback } from 'react';

/*
 * ============================================================
 * CONTEXTO DE AUTENTICACIÓN — AuthContext.jsx
 * ============================================================
 * El "Contexto" de React es un mecanismo para compartir datos
 * globales (como el usuario autenticado) entre componentes sin
 * tener que pasar props manualmente de padre a hijo en cada nivel.
 *
 * Este archivo expone:
 *  - `user`: objeto con los datos del usuario activo (admin/cliente/empleado).
 *  - `token`: el JWT recibido del backend al iniciar sesión.
 *  - `login()`: guarda el token y los datos del usuario.
 *  - `logout()`: borra todo y cierra la sesión.
 *  - `isAuthenticated`: booleano que indica si hay una sesión activa.
 * ============================================================
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // 1- Al cargar la aplicación, revisamos si ya había una sesión guardada en
  //    el navegador (localStorage). Esto evita que el usuario tenga que
  //    iniciar sesión cada vez que refresca la página.
  useEffect(() => {
    const guardadoToken    = localStorage.getItem('token');
    const guardadoTipo     = localStorage.getItem('userType');
    const guardadosDatos   = localStorage.getItem('userData');

    if (guardadoToken) {
      setToken(guardadoToken);
      setUser({
        type: guardadoTipo || 'employee',
        // Si había datos guardados (nombre, correo, etc.), los parseamos de JSON
        ...(guardadosDatos ? JSON.parse(guardadosDatos) : {})
      });
    }
    // Terminamos de cargar: la app ya sabe si hay sesión o no
    setLoading(false);
  }, []);

  // 2- Función para iniciar sesión.
  //    Recibe: el token JWT, el tipo de usuario y sus datos opcionales.
  //    Guarda todo en localStorage para persistir entre recargas.
  const login = useCallback((nuevoToken, tipoUsuario = 'employee', datosUsuario = null) => {
    localStorage.setItem('token', nuevoToken);
    localStorage.setItem('userType', tipoUsuario);
    if (datosUsuario) {
      localStorage.setItem('userData', JSON.stringify(datosUsuario));
    }
    setToken(nuevoToken);
    setUser({ type: tipoUsuario, ...datosUsuario });
  }, []);

  // 3- Función para cerrar sesión.
  //    Borra todos los datos del navegador y resetea el estado a null.
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  }, []);

  // 4- Exponemos el estado y las funciones a todos los componentes hijos.
  //    `isAuthenticated` es simplemente true si hay un token válido.
  //    No renderizamos los hijos hasta que terminemos de verificar
  //    la sesión guardada (loading === false), para evitar parpadeos.
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
