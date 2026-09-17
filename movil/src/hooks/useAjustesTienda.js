/*
 * ============================================================
 * AJUSTES DE LA TIENDA — useAjustesTienda.js
 * ============================================================
 * El nombre (o el logo) que puso el dueño en Personalización, del lado del
 * teléfono. Es el mismo GET público que usa la web (`/storeSettings`); ver
 * `frontend/src/hooks/useAjustesTienda.js` para la versión completa, que
 * además guarda cambios — aquí solo hace falta leer.
 *
 * Si el servidor no contesta se queda con el respaldo. Un encabezado sin
 * nombre por una petición de adorno que falló sería peor que mostrar el
 * nombre de siempre.
 */

import { useCallback, useEffect, useState } from 'react';
import peticion from '../api/api';

const DE_RESPALDO = {
  nombreLinea1: 'Tienda',
  nombreLinea2: 'la 635',
  logoUrl: '',
};

export const useAjustesTienda = () => {
  const [ajustes, setAjustes] = useState(DE_RESPALDO);

  const cargar = useCallback(async () => {
    try {
      const datos = await peticion('/storeSettings');
      setAjustes({ ...DE_RESPALDO, ...(datos || {}) });
    } catch {
      // Se deja el respaldo puesto.
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { ajustes };
};

export default useAjustesTienda;
