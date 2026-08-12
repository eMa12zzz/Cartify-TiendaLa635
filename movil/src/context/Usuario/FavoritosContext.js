import { createContext, useContext } from 'react';
import { useFavoritos } from '../../hooks/Usuario/useFavoritos';

/*
 * FavoritosContext — una sola lista de favoritos para toda la app.
 * Puerto de `frontend/src/context/FavoritosContext.jsx`.
 *
 * El corazón aparece en la grilla, en las filas de secciones y en Mi Cuenta.
 * Si cada tarjeta llamara al hook por su cuenta, abrir la tienda dispararía
 * muchas peticiones idénticas. Con el contexto se pide una vez y todos los
 * corazones se encienden juntos.
 */
const FavoritosContext = createContext(null);

export const FavoritosProvider = ({ children }) => {
  const favoritos = useFavoritos();
  return (
    <FavoritosContext.Provider value={favoritos}>
      {children}
    </FavoritosContext.Provider>
  );
};

/*
 * Devuelve algo usable aunque no haya proveedor arriba: así una tarjeta de
 * producto puede vivir fuera del árbol sin romperse.
 */
const SIN_PROVEEDOR = {
  ids: [], productos: [], cargando: false,
  esFavorito: () => false,
  alternar: () => {},
  recargar: () => {},
};

export const useFavoritosCtx = () => useContext(FavoritosContext) || SIN_PROVEEDOR;

export default FavoritosContext;
