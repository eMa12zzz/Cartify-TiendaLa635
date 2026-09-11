import { useEffect, useState } from 'react';
import { getTiempoPorZona } from '../api/pedidosApi';

/*
 * useTiempoPorZona — cuánto se ha tardado en llegar a un punto, según las
 * entregas ya hechas por ahí.
 *
 * Checkout.js ya hace esta misma consulta a mano (para "cuánto tardaría si
 * pide aquí"); este hook es la misma idea empaquetada para quien solo
 * necesita el resultado, como BurbujaPedido — el pedido "está preparando" y
 * todavía no hay repartidor ni punto que seguir en el mapa, pero la persona
 * igual quiere saber si le da tiempo de bañarse.
 */
export const useTiempoPorZona = (lat, lng) => {
  const [zona, setZona] = useState({ hayDatos: false });

  useEffect(() => {
    if (lat == null || lng == null) {
      setZona({ hayDatos: false });
      return;
    }

    let vivo = true;
    getTiempoPorZona(lat, lng)
      .then((r) => vivo && setZona(r || { hayDatos: false }))
      // Que falle no dice nada: mejor callarse que inventar un tiempo.
      .catch(() => vivo && setZona({ hayDatos: false }));

    return () => {
      vivo = false;
    };
  }, [lat, lng]);

  return zona;
};

export default useTiempoPorZona;
