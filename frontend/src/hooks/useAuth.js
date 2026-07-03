import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/*
 * ============================================================
 * HOOK PERSONALIZADO — useAuth.js
 * ============================================================
 * Un "hook" en React es una función reutilizable que encapsula
 * lógica de estado. Este hook simplifica el acceso al contexto
 * de autenticación: en vez de importar AuthContext y useContext
 * en cada componente, solo se importa este hook.
 *
 * Uso:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *
 * Si se llama fuera de un <AuthProvider>, lanza un error para
 * avisar que el árbol de componentes está mal configurado.
 * ============================================================
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
};
