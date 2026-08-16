import { createContext, useContext } from 'react';
import { useFavoritos } from '../hooks/useFavoritos';

/*
 * FavoritosContext — una sola lista de favoritos para toda la app.
 *
 * El corazón aparece en la grilla, en las filas de secciones, en el detalle
 * de la promo y en Mi Cuenta. Si cada tarjeta llamara al hook por su cuenta,
 * abrir la tienda dispararía treinta peticiones idénticas y cada corazón
 * tendría su propia idea de qué está guardado.
 *
 * Con el contexto se pide una vez y todos los corazones se encienden juntos.
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
 * producto puede vivir fuera del árbol de la tienda sin romperse.
 */
const SIN_PROVEEDOR = {
  ids: [], productos: [], cargando: false,
  esFavorito: () => false,
  alternar: () => {},
  recargar: () => {},
};

export const useFavoritosCtx = () => useContext(FavoritosContext) || SIN_PROVEEDOR;
