import { createContext, useContext } from 'react';
import { useAjustesTienda } from '../hooks/useAjustesTienda';
import { NOMBRE_TIENDA, DIRECCION_EN_UNA_LINEA } from '../utils/tienda';
import { resolverPortada } from '../utils/portada';

/*
 * AjustesContext — cómo se ve la tienda, pedido UNA sola vez.
 *
 * El nombre y el logo los pinta el encabezado, el pie y el login del panel; el
 * orden de la portada lo usa la tienda. Si cada uno llamara al hook por su
 * cuenta serían cuatro peticiones de lo mismo en cada carga, y las cuatro
 * llegarían en momentos distintos: el encabezado ya con el nombre nuevo y el
 * pie todavía con el viejo.
 *
 * Mismo patrón que DireccionContext y FavoritosContext.
 */
const AjustesContext = createContext(null);

export const AjustesProvider = ({ children }) => {
  const ajustes = useAjustesTienda();
  return (
    <AjustesContext.Provider value={ajustes}>
      {children}
    </AjustesContext.Provider>
  );
};

/*
 * Valores neutros para quien pregunte desde fuera del árbol, para que
 * preguntar de más nunca reviente nada.
 *
 * El contexto expone TODO lo que devuelve el hook, incluidas las funciones de
 * edición: así la pantalla de Personalización del panel edita la misma copia
 * que pinta la tienda, y guardar el nombre se ve al instante en el encabezado
 * en vez de esperar a una recarga completa.
 */
const SIN_PROVEEDOR = {
  ajustes: {
    nombreLinea1: NOMBRE_TIENDA.arriba,
    nombreLinea2: NOMBRE_TIENDA.abajo,
    logoUrl: '',
    lema: '',
    direccion: DIRECCION_EN_UNA_LINEA,
    costoEnvio: 4.78,
    secciones: [],
    temporada: { modo: 'automatico', tema: '' },
  },
  portada: resolverPortada([]),
  portadaVisible: resolverPortada([]),
  cargando: false,
  guardando: false,
  guardar: () => {},
  mover: () => {},
  alternarVisible: () => {},
  subirLogo: () => {},
  quitarLogo: () => {},
  recargar: () => {},
};

export const useAjustesCtx = () => useContext(AjustesContext) || SIN_PROVEEDOR;
