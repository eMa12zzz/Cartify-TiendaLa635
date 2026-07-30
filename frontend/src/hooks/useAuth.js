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
 *   const { user, login, logout, isAuthenticated, esCliente } = useAuth();
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

  /*
   * ¿Esta sesión es de un CLIENTE, o de alguien del personal?
   *
   * La pregunta parece de más —quien entró, entró— pero no lo es: las
   * pantallas del cliente (direcciones, favoritos, puntos, métodos de pago)
   * piden datos a /client/:id, y ese endpoint solo conoce clientes. Con una
   * sesión de administrador devuelve 404 y el aviso de error le salta en la
   * cara a alguien que no hizo nada malo, nada más entró a ver su tienda.
   *
   * Pasa de verdad y seguido: la misma persona que administra la tienda es
   * clienta de su propia tienda, y el mismo correo existe en las dos tablas.
   *
   * Vive aquí y no en cada hook porque ya se había resuelto suelto en
   * useFavoritos y en useReviews, y los otros cuatro se quedaron sin él. Un
   * guard copiado a mano en seis archivos es un guard que en el séptimo se
   * olvida.
   */
  const esCliente = context.user?.type === 'client' && !!context.user?.id;

  return { ...context, esCliente };
};
