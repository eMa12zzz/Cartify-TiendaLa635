import { createContext, useContext } from 'react';
import { useStore } from '../../hooks/Usuario/useStore';

/*
 * TiendaContext — una sola instancia de la tienda (catálogo + carrito) para
 * TODA la app. Así la pantalla de la tienda, el carrito y el checkout comparten
 * el mismo carrito y el mismo catálogo, sin recargarlo en cada una ni tener
 * carritos distintos por pantalla. Equivale a subir el estado de useStore (que
 * en la web vivía en Store.jsx) a un contexto.
 */
const TiendaContext = createContext(null);

export const TiendaProvider = ({ children }) => {
  const store = useStore();
  return <TiendaContext.Provider value={store}>{children}</TiendaContext.Provider>;
};

export const useTienda = () => {
  const ctx = useContext(TiendaContext);
  if (!ctx) throw new Error('useTienda se usó fuera de un TiendaProvider');
  return ctx;
};

export default TiendaContext;
