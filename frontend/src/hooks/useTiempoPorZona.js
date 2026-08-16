import { useState, useEffect } from 'react';
import { orderService } from '../api/orderService';

/*
 * ============================================================
 * TIEMPO POR ZONA — useTiempoPorZona.js
 * ============================================================
 * Cuánto tardamos en llegar a SU zona, calculado con las entregas que ya
 * hicimos por ahí.
 *
 * Todas las tiendas prometen "30 a 45 minutos" y ese rango no sale de ningún
 * dato: es lo que suena razonable. Nosotros ya tenemos con qué responder de
 * verdad, y decirlo con el número de entregas en que se basa ("según 8
 * entregas a su zona") es lo que separa un dato de una promesa de vendedor.
 *
 * Cuando todavía no hay historial suficiente, este hook devuelve
 * `hayDatos: false` y la pantalla no dice nada. Inventar un tiempo para
 * llenar el hueco sería exactamente lo que estamos tratando de no hacer.
 * ============================================================
 */
export const useTiempoPorZona = (lat, lng) => {
  /*
   * El punto va DENTRO de la respuesta guardada. Así, al cambiar de
   * dirección, lo de la anterior se descarta al comparar en vez de tener que
   * limpiarlo con un setState dentro del efecto (que provoca un render de
   * más y deja ver por un instante el tiempo de la otra zona).
   */
  const clave = lat != null && lng != null ? `${lat},${lng}` : null;
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    // Sin punto en el mapa no hay zona que consultar: pasa con las
    // direcciones viejas, que se guardaron como texto suelto.
    if (!clave) return;

    let vivo = true;

    orderService
      .getTiempoPorZona(lat, lng)
      .then((r) => { if (vivo) setDatos({ clave, ...r }); })
      // Si la consulta falla, se guarda el "no hay datos" igual: la pantalla
      // simplemente no dice nada, que es mejor que quedarse cargando para
      // siempre.
      .catch(() => { if (vivo) setDatos({ clave, hayDatos: false }); });

    return () => { vivo = false; };
  }, [clave, lat, lng]);

  // Lo de otra dirección no cuenta.
  const actual = clave && datos?.clave === clave ? datos : null;
  const cargando = !!clave && !actual;

  /*
   * El texto ya armado, para que las pantallas no repitan la misma frase
   * cada una a su manera. Se habla en rango (típico → holgado) porque un
   * número solo se lee como promesa, y el tráfico no lo controlamos.
   */
  const texto = actual?.hayDatos
    ? (actual.tipico === actual.holgado
        ? `Llega en unos ${actual.tipico} min`
        : `Llega entre ${actual.tipico} y ${actual.holgado} min`)
    : '';

  const respaldo = actual?.hayDatos
    ? `Según ${actual.entregas} ${actual.entregas === 1 ? 'entrega' : 'entregas'} a su zona`
    : '';

  return {
    hayDatos: !!actual?.hayDatos,
    entregas: actual?.entregas || 0,
    tipico: actual?.tipico ?? null,
    holgado: actual?.holgado ?? null,
    texto,
    respaldo,
    cargando,
  };
};
