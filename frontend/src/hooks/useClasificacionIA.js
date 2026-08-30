import { useState, useEffect, useRef, useMemo } from 'react';
import { clasificacionService } from '../api/clasificacionService';
import { clasificarPorReglas, esFamiliaValida } from '../utils/familias';
import { useAuth } from './useAuth';

/*
 * useClasificacionIA — el PASO 2 del clasificador: lo que las reglas no pudieron.
 *
 * El 90% del catálogo de una tienda de barrio lo resuelve familias.js con puras
 * reglas: instantáneo, gratis y sin internet. Este hook se encarga del resto —
 * los nombres raros, las marcas nuevas, lo que a nadie se le ocurrió poner en
 * el léxico — y lo hace con tres cuidados que son el diseño entero:
 *
 *   1. Solo pregunta por lo que NO se sabe. Si las reglas resolvieron todo, no
 *      sale ni una petición.
 *   2. Pregunta EN LOTE, no producto por producto. Una petición por cada papita
 *      quemaría la cuota gratis en dos días.
 *   3. La respuesta se guarda en el producto (lo hace el backend) y aquí se
 *      recuerda en el navegador. Cada producto se clasifica UNA VEZ, no en cada
 *      carga de la página.
 *
 * Si algo falla, se calla y no vuelve a intentar en esta visita. La tienda se
 * ve igual, solo sin esas filas de más.
 */

const LLAVE_CACHE = 'kartify:familias-ia';
const MAXIMO_POR_LOTE = 60; // lo que cabe en una petición sin volverla lenta

/*
 * La memoria vive fuera del hook (a nivel de módulo) para que sobreviva a los
 * cambios de pantalla: el cliente entra a un producto, vuelve a la tienda y el
 * hook se monta de nuevo, pero lo ya preguntado sigue sabido.
 */
const memoria = new Map();
const yaPreguntados = new Set();

// Lo aprendido se guarda en el navegador. Si el localStorage está lleno o
// bloqueado (modo privado), no pasa nada: se sigue sin memoria entre visitas.
const leerCache = () => {
  try {
    const crudo = localStorage.getItem(LLAVE_CACHE);
    if (!crudo) return;
    Object.entries(JSON.parse(crudo) || {}).forEach(([idProducto, familia]) => {
      if (esFamiliaValida(familia)) memoria.set(idProducto, familia);
    });
  } catch {
    // Cache corrupta o inaccesible: se empieza de cero y ya.
  }
};

const guardarCache = () => {
  try {
    localStorage.setItem(LLAVE_CACHE, JSON.stringify(Object.fromEntries(memoria)));
  } catch {
    // Sin espacio para guardar: la clasificación de esta visita igual funciona.
  }
};

leerCache();

export const useClasificacionIA = (productos) => {
  // QUIÉN puede preguntarle a la IA. Ver el guard del efecto, más abajo.
  const { haySesionDePersonal } = useAuth();

  const [familias, setFamilias] = useState(() => Object.fromEntries(memoria));
  const [clasificando, setClasificando] = useState(false);
  /*
   * `vuelta` es lo que dispara el siguiente lote. Con catálogos de más de 60
   * productos sin clasificar hace falta ir por tandas, y cambiar este número
   * hace que el efecto se vuelva a mirar los pendientes. Se detiene solo:
   * cuando ya no queda nada pendiente, el efecto sale sin tocar el estado.
   */
  const [vuelta, setVuelta] = useState(0);
  // Si la petición falla una vez, no se insiste. Reintentar en bucle contra un
  // servidor caído solo llena la consola y calienta el teléfono.
  const rendido = useRef(false);

  /*
   * Los que nadie supo clasificar: ni vienen con familia guardada, ni las
   * reglas los resolvieron, ni se preguntaron ya en esta sesión.
   */
  const pendientes = useMemo(() => {
    // Ojo: aquí NO se mira `rendido`. Leer un ref mientras se pinta está
    // prohibido en React (y el linter lo caza). El "ya me rendí" se revisa
    // abajo, en el efecto, que es donde de verdad importa.
    return (productos || []).filter((p) => {
      const idProducto = p?.id || p?._id;
      if (!idProducto || yaPreguntados.has(idProducto)) return false;
      if (esFamiliaValida(p.familia)) return false;
      if (memoria.has(idProducto)) return false;
      return !clasificarPorReglas(p);
    });
    // `vuelta` entra en las dependencias a propósito: es la señal de "ya
    // terminó un lote, mirá si quedó algo".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, vuelta]);

  useEffect(() => {
    /*
     * SOLO PREGUNTA EL PERSONAL. Este es el guard más importante del archivo.
     *
     * POST /ai/clasificar es soloPersonal en el backend —gasta cuota de
     * Gemini, y abierta cualquiera se la quema con un bucle—. Pero este hook
     * cuelga de useSeccionesTienda, o sea de la PORTADA PÚBLICA, así que la
     * petición salía en cada visita y el servidor contestaba 401.
     *
     * Y un 401 no se queda quieto: el interceptor de api.js lo lee como "su
     * sesión venció", borra el cajón y manda al login. El resultado era que un
     * cliente NO PODÍA MANTENER LA SESIÓN ABIERTA — entraba con su contraseña,
     * la portada disparaba esta petición y lo devolvía al login antes de que
     * alcanzara a ver un producto. Y al visitante sin cuenta le saltaba un
     * aviso rojo de "Inicie sesión para ver esto" nada más entrar a mirar.
     *
     * Que pregunte solo el personal no le quita nada al cliente: lo que la IA
     * resuelve, el backend LO GUARDA en el producto, así que basta con que el
     * dueño pase por su tienda para que el catálogo quede clasificado para
     * todo el mundo. Mientras tanto la portada se arma igual con las reglas de
     * familias.js, que resuelven el 90%.
     */
    if (!haySesionDePersonal) return;

    if (!pendientes.length || rendido.current) return;

    const lote = pendientes.slice(0, MAXIMO_POR_LOTE);
    // Se marcan ANTES de pedir: entre que sale la petición y vuelve, el
    // componente se pinta varias veces y sin esta guarda se pediría lo mismo
    // dos y tres veces.
    lote.forEach((p) => yaPreguntados.add(p.id || p._id));

    let vivo = true;
    const preguntar = async () => {
      setClasificando(true);
      // Solo el id y el nombre: el precio y el stock no ayudan a saber si algo
      // es un energizante, y de paso viaja menos información del cliente.
      const datos = await clasificacionService.clasificarProductos(
        lote.map((p) => ({ id: p.id || p._id, nombre: p.nombre || p.name || '' }))
      );

      const respuesta = Array.isArray(datos?.familias) ? datos.familias : [];
      // Que no venga nada es normal (la IA no está configurada o no supo). Que
      // haya fallado la red es otra cosa: ahí no vale la pena seguir
      // preguntando por los demás lotes.
      if (datos?.origen === 'sin-red') rendido.current = true;

      /*
       * Lo aprendido se apunta aunque el hook ya se haya desmontado (el cliente
       * se cambió de pasillo mientras cargaba): la memoria vive fuera de React
       * y tirar una respuesta que ya se pagó sería desperdiciarla. Lo que sí se
       * salta es tocar el estado de un componente que ya no existe.
       */
      let hubo = false;
      respuesta.forEach(({ id: idProducto, familia }) => {
        if (!idProducto || !esFamiliaValida(familia)) return;
        memoria.set(String(idProducto), familia);
        hubo = true;
      });
      if (hubo) guardarCache();

      if (!vivo) return;
      if (hubo) setFamilias(Object.fromEntries(memoria));
      setClasificando(false);
      // Siguiente tanda (si quedó alguna). Si no quedó, el efecto no hace nada.
      if (!rendido.current) setVuelta((v) => v + 1);
    };

    preguntar();
    return () => { vivo = false; };
  }, [pendientes, haySesionDePersonal]);

  return { familias, clasificando };
};
