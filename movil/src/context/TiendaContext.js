/*
 * ============================================================
 * LA TIENDA — catálogo, filtros y carrito
 * ============================================================
 * El equivalente de `frontend/src/hooks/useStore.js`, con el mismo contrato:
 * quien conozca la web encuentra aquí `productosFiltrados`, `carrito`,
 * `agregarAlCarrito`, `totalCarrito` y compañía con esos mismos nombres.
 *
 * ── Por qué es un contexto y no un hook ──
 *
 * En la web `useStore` se llama desde Store.jsx y el carrito se abre como un
 * panel DENTRO de esa misma pantalla, así que un hook alcanza. Aquí Inicio y
 * Carrito son dos pantallas separadas: si cada una llamara a su propio hook,
 * cada una tendría su propio carrito y su propia copia del catálogo. El
 * estado tiene que vivir por encima de las dos.
 *
 * ── Lo que se dejó fuera, a propósito ──
 *
 * La búsqueda de la web también entiende ESTANTES ("energizante" encuentra las
 * latas aunque ninguna se llame así), y eso son 666 líneas entre
 * `utils/familias.js` y `utils/similitud.js`. Aquí se busca por nombre, marca
 * y categoría. Es menos listo, no es distinto: lo que ya se encontraba por esos
 * tres campos se sigue encontrando igual.
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cargarTienda } from '../api/tiendaApi';
import { getModulos } from '../api/moduleApi';
import { mapearCatalogo, idsDePromo, totalDeLinea } from '../utils/catalogo';
import { modulosVisibles, flujoDeModulo } from '../utils/modulos';
import { armarSecciones } from '../utils/secciones';
import { promosVisibles, promoEnModulo } from '../utils/promos';
import { cantidadConUnidad } from '../utils/unidades';
import { guardar, leer, borrar, llave } from '../utils/almacen';
import { useAviso } from './AvisoContext';
import { useAuth } from '../hooks/useAuth';

const TiendaContext = createContext(null);

/*
 * ── El carrito guardado ──
 *
 * Una llave POR PERSONA y otra para quien todavía no entró, igual que en la
 * web. Así al cerrar sesión no queda a la vista el carrito de quien estaba
 * antes: su llave sencillamente ya no se lee.
 *
 * Los dos puntos de la llave de la web (`kartify:carrito:x`) no sirven aquí:
 * SecureStore solo acepta alfanuméricos, punto, guion y guion bajo. Ver
 * utils/almacen.js.
 */
const llaveCarrito = (userId) => llave('cartify', 'carrito', userId || 'invitado');

/*
 * Se guarda SOLO el id y la cantidad. Nunca el precio.
 *
 * Eso es lo importante: un precio guardado en el teléfono es un precio de
 * ayer, y el día que la tienda suba uno, quien tuviera el producto en el
 * carrito lo pagaría al viejo. Al no guardarlo no hay nada que reconciliar —
 * el precio, la promo y el stock salen siempre del catálogo recién cargado.
 */
const normalizarLineas = (crudo) => {
  try {
    const datos = JSON.parse(crudo || '[]');
    if (!Array.isArray(datos)) return [];
    return datos
      .map((l) => ({ id: String(l?.id ?? ''), cantidad: Number(l?.cantidad) || 0 }))
      .filter((l) => l.id && l.cantidad > 0);
  } catch {
    // Guardado ilegible: se arranca con el carrito vacío, que es preferible a
    // no poder abrir la tienda.
    return [];
  }
};

export const TiendaProvider = ({ children }) => {
  const { avisar } = useAviso();
  const { user } = useAuth();

  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Los pasillos (módulos) de la tienda: panadería, farmacia... Se cargan
  // aparte del catálogo y no lo bloquean — si esta lista falla, la tienda
  // sigue mostrando todo, solo sin el filtro por pasillo.
  //
  // `todosLosModulos` es la lista completa (incluye los de flujo propio,
  // como Impresiones); `pasillos` es la que de verdad filtra el catálogo, y
  // por eso se queda solo con los de flujo 'estandar' — ver utils/modulos.js.
  // MenuPasillos.js necesita la lista completa para poder MOSTRAR Impresiones
  // aunque no la use para filtrar nada.
  const [todosLosModulos, setTodosLosModulos] = useState([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const pasillos = useMemo(
    () => todosLosModulos.filter((m) => flujoDeModulo(m) === 'estandar'),
    [todosLosModulos]
  );

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  // La promo que está filtrando la lista, y la que se está mirando en detalle.
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);
  const [promoDetalle, setPromoDetalle] = useState(null);

  // Las líneas guardadas: [{ id, cantidad }].
  const [lineas, setLineas] = useState([]);
  // Hasta no haber leído el almacén no se sabe qué hay: sin esto, el efecto
  // que guarda escribiría un carrito vacío encima del guardado.
  const [carritoLeido, setCarritoLeido] = useState(false);

  const llaveActual = llaveCarrito(user?.id);

  /* ══════════════ EL CATÁLOGO ══════════════ */

  const traerCatalogo = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga('');
      const { productos: crudos, promociones: promos } = await cargarTienda();
      setProductos(mapearCatalogo(crudos, promos));
      setPromociones(promos);
    } catch (error) {
      /*
       * En la web esto es un console.error y la tienda se queda vacía. Aquí se
       * guarda el mensaje: en un teléfono, "no hay productos" y "no hay
       * internet" se ven igual, y el segundo tiene arreglo.
       */
      setErrorCarga(error?.message || 'No se pudo cargar la tienda');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    traerCatalogo();
  }, [traerCatalogo]);

  useEffect(() => {
    let vivo = true;
    getModulos()
      .then((datos) => {
        if (!vivo) return;
        setTodosLosModulos(modulosVisibles(datos));
      })
      .catch(() => {
        // Sin pasillos la tienda se ve completa, sin el botón de filtrar —
        // no hay razón para que esto tumbe la portada.
        if (vivo) setTodosLosModulos([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  /*
   * Los productos de UN pasillo, o todos si no hay ninguno elegido. De acá
   * salen categorías, destacados y "Se están acabando" — elegir "Panadería"
   * tiene que sentirse como entrar a una tienda más chica, no como un filtro
   * más encima del catálogo entero.
   */
  const productosDelPasillo = useMemo(() => {
    if (!moduloSeleccionado) return productos;
    return productos.filter((p) => String(p.moduloId) === String(moduloSeleccionado));
  }, [productos, moduloSeleccionado]);

  // Cambiar de pasillo limpia la categoría: una categoría de "Panadería" no
  // dice nada dentro de "Farmacia", y dejarla puesta filtraría a cero.
  useEffect(() => {
    setCategoriaSeleccionada(null);
  }, [moduloSeleccionado]);

  const nombrePasillo = useMemo(
    () => pasillos.find((m) => String(m._id) === String(moduloSeleccionado))?.name || '',
    [pasillos, moduloSeleccionado]
  );

  const categorias = useMemo(() => {
    const cats = new Set(productosDelPasillo.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productosDelPasillo]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productosDelPasillo;

    // Filtro por promo (el banner): solo los productos de esa promo.
    if (promoSeleccionada) {
      const ids = idsDePromo(promoSeleccionada);
      filtrados = filtrados.filter((p) => ids.includes(p.id));
    }

    if (categoriaSeleccionada) {
      filtrados = filtrados.filter((p) => p.categoria === categoriaSeleccionada);
    }

    if (terminoBusqueda.trim()) {
      const busqueda = terminoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(busqueda) ||
          p.marca?.toLowerCase().includes(busqueda) ||
          p.categoria?.toLowerCase().includes(busqueda)
      );
    }

    return filtrados;
  }, [productosDelPasillo, categoriaSeleccionada, terminoBusqueda, promoSeleccionada]);

  const productosDestacados = useMemo(() => productosDelPasillo.slice(0, 6), [productosDelPasillo]);

  /*
   * Las filas que se arman solas con el inventario ("Se están acabando",
   * "Nuevos en la tienda"). Ver utils/secciones.js para cuáles y por qué esas.
   */
  const secciones = useMemo(() => armarSecciones(productosDelPasillo), [productosDelPasillo]);

  // Las que de verdad se anuncian en el carrusel, y solo las de ESTE pasillo
  // — igual que la web (PromoBanners con moduloId). Sin pasillo elegido
  // (toda la tienda) salen todas.
  const promosDelCarrusel = useMemo(
    () => promosVisibles(promociones).filter((p) => promoEnModulo(p, moduloSeleccionado)),
    [promociones, moduloSeleccionado]
  );

  /*
   * Los productos de la promo abierta salen del catálogo ya mapeado, no de
   * promo.items, para que se vean con su precio de oferta y su stock real —
   * los mismos que verá en la tienda.
   */
  const productosDePromo = useMemo(() => {
    if (!promoDetalle) return [];
    const ids = idsDePromo(promoDetalle);
    return productos.filter((p) => ids.includes(p.id));
  }, [productos, promoDetalle]);

  const abrirPromo = useCallback((promo) => setPromoDetalle(promo), []);
  const cerrarPromo = useCallback(() => setPromoDetalle(null), []);

  /*
   * "Ver todos en la tienda": cierra el detalle y deja la lista filtrada a esa
   * promo, limpiando categoría y búsqueda para que no se peleen entre filtros.
   */
  const verPromoEnTienda = useCallback((promo) => {
    setPromoSeleccionada(promo);
    setCategoriaSeleccionada(null);
    setTerminoBusqueda('');
    setPromoDetalle(null);
  }, []);

  /* ══════════════ EL CARRITO ══════════════ */

  // Al abrir la app, o al cambiar de persona: leer lo guardado de esa llave.
  useEffect(() => {
    let vivo = true;
    setCarritoLeido(false);

    (async () => {
      const crudo = await leer(llaveActual);
      if (!vivo) return;
      setLineas(normalizarLineas(crudo));
      setCarritoLeido(true);
    })();

    return () => {
      vivo = false;
    };
  }, [llaveActual]);

  /*
   * Al iniciar sesión, lo que llenó como invitado se pasa a su cuenta.
   *
   * Sin esto el arreglo queda a medias justo donde más duele: la tienda se
   * recorre sin cuenta, el carrito se llena sin cuenta, y al entrar para pagar
   * la llave cambia y el carrito aparece vacío. Se toma la cantidad MAYOR de
   * las dos, nunca la suma, para no duplicar sin querer.
   */
  useEffect(() => {
    if (!user?.id) return;
    let vivo = true;

    (async () => {
      const deInvitado = normalizarLineas(await leer(llaveCarrito(null)));
      if (!vivo || deInvitado.length === 0) return;

      const suya = llaveCarrito(user.id);
      const fusion = normalizarLineas(await leer(suya));
      if (!vivo) return;

      deInvitado.forEach((linea) => {
        const i = fusion.findIndex((f) => f.id === linea.id);
        if (i === -1) fusion.push(linea);
        else fusion[i] = { ...fusion[i], cantidad: Math.max(fusion[i].cantidad, linea.cantidad) };
      });

      await borrar(llaveCarrito(null));
      if (!vivo) return;

      setLineas(fusion);
      guardar(suya, JSON.stringify(fusion));
    })();

    return () => {
      vivo = false;
    };
  }, [user?.id]);

  /*
   * El carrito que se ve = lo guardado CASADO con el catálogo de hoy.
   *
   * Por eso un producto que la tienda dio de baja o que se quedó sin stock
   * desaparece solo, y una cantidad guardada mayor a lo que hay se recorta a
   * lo que hay. Mientras el catálogo no haya cargado no se muestra nada: es
   * preferible un carrito que tarda un instante a uno que enseña precios que
   * ya no son.
   */
  const carrito = useMemo(() => {
    if (lineas.length === 0 || productos.length === 0) return [];
    const porId = new Map(productos.map((p) => [String(p.id), p]));
    return lineas.reduce((lista, linea) => {
      const p = porId.get(linea.id);
      if (!p || p.stock <= 0) return lista;
      lista.push({ ...p, cantidad: Math.min(linea.cantidad, p.stock) });
      return lista;
    }, []);
  }, [lineas, productos]);

  /*
   * Guardar es "escribir estas líneas y recordarlas". Se pasa la lista ya
   * resuelta (con nombre, precio, etc.) y aquí se recorta a {id, cantidad}:
   * quien llama no tiene que acordarse de no guardar el precio.
   */
  const guardarCarrito = useCallback(
    (lista) => {
      const nuevas = (lista || [])
        .map((i) => ({ id: String(i.id), cantidad: Number(i.cantidad) || 0 }))
        .filter((l) => l.id && l.cantidad > 0);

      setLineas(nuevas);

      if (nuevas.length === 0) {
        borrar(llaveActual);
        return;
      }

      guardar(llaveActual, JSON.stringify(nuevas)).then((ok) => {
        /*
         * SecureStore tiene un tope de tamaño (~2048 bytes en iOS). Un carrito
         * son pares id+cantidad, así que hacen falta decenas de líneas para
         * acercarse — pero si un día pasa, callarlo sería lo peor: el carrito
         * seguiría bien en pantalla y aparecería vacío al volver mañana, sin
         * que nadie entienda por qué.
         */
        if (!ok) avisar('Su carrito funciona, pero no se pudo guardar para la próxima vez', 'error');
      });
    },
    [llaveActual, avisar]
  );

  /*
   * Cuando el catálogo termina de cargar, lo guardado se limpia de una vez: lo
   * que ya no existe se borra y lo que se recortó se guarda recortado. Si no,
   * la corrección se rehacía en cada visita y el aviso volvía a salir cada vez.
   *
   * Se avisa porque callarlo es peor: quien pidió tres y recibe dos merece
   * enterarse ahora y no en la puerta de su casa.
   */
  const yaConciliado = useRef(false);
  useEffect(() => {
    if (cargando || !carritoLeido || yaConciliado.current) return;
    /*
     * Catálogo vacío = la API no respondió. Ahí no se toca nada: borrarle el
     * carrito a alguien porque se cayó el servidor sería el peor arreglo.
     */
    if (productos.length === 0 || lineas.length === 0) return;
    yaConciliado.current = true;

    const fuera = lineas.length - carrito.length;
    const recortados = carrito.filter((i) => {
      const guardada = lineas.find((l) => l.id === String(i.id));
      return guardada && guardada.cantidad > i.cantidad;
    }).length;

    if (fuera === 0 && recortados === 0) return;

    guardarCarrito(carrito);

    const partes = [];
    if (fuera > 0) {
      partes.push(fuera === 1 ? 'un producto ya no está disponible' : `${fuera} productos ya no están disponibles`);
    }
    if (recortados > 0) {
      partes.push(
        recortados === 1
          ? 'de otro quedaban menos unidades de las que llevaba'
          : `de ${recortados} quedaban menos unidades de las que llevaba`
      );
    }
    avisar(`De su carrito guardado, ${partes.join(' y ')}. Ya está corregido.`);
  }, [cargando, carritoLeido, productos, lineas, carrito, guardarCarrito, avisar]);

  const agregarAlCarrito = useCallback(
    (producto, cantidad = 1) => {
      if (!producto?.id) return;
      const stock = Number(producto.stock) || 0;
      if (stock <= 0) {
        avisar(`${producto.nombre} se quedó sin existencias`, 'error');
        return;
      }

      const enCarrito = carrito.find((i) => i.id === producto.id)?.cantidad || 0;
      const nuevaCantidad = enCarrito + cantidad;
      if (nuevaCantidad > stock) {
        // "Solo hay 3 unidades" de un queso que se vende por peso confunde: se
        // dice en la unidad en que se vende. Ver utils/unidades.js.
        avisar(`Solo hay ${cantidadConUnidad(producto, stock)} disponibles`, 'error');
        return;
      }

      guardarCarrito(
        enCarrito
          ? carrito.map((item) => (item.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item))
          : [...carrito, { id: producto.id, cantidad }]
      );

      /*
       * El aviso dice cuántas lleva, no solo que se agregó: al segundo toque el
       * texto era idéntico y no había forma de saber si el toque contó.
       */
      avisar(
        nuevaCantidad > 1
          ? `${producto.nombre} · ${cantidadConUnidad(producto, nuevaCantidad)} en el carrito`
          : `${producto.nombre} agregado al carrito`
      );
    },
    [carrito, guardarCarrito, avisar]
  );

  const eliminarDelCarrito = useCallback(
    (productoId) => {
      const fuera = carrito.find((i) => i.id === productoId);
      guardarCarrito(carrito.filter((item) => item.id !== productoId));
      avisar(fuera ? `${fuera.nombre} salió del carrito` : 'Producto eliminado');
    },
    [carrito, guardarCarrito, avisar]
  );

  const actualizarCantidad = useCallback(
    (productoId, nuevaCantidad) => {
      if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productoId);
        return;
      }
      const item = carrito.find((i) => i.id === productoId);
      if (!item) return;
      /*
       * El tope se respeta también aquí, no solo apagando el botón: el "+" se
       * pulsa más rápido de lo que el render alcanza a deshabilitarlo.
       */
      const cantidad = Math.min(nuevaCantidad, item.stock);
      if (cantidad === item.cantidad) return;
      guardarCarrito(carrito.map((i) => (i.id === productoId ? { ...i, cantidad } : i)));
    },
    [carrito, guardarCarrito, eliminarDelCarrito]
  );

  const limpiarCarrito = useCallback(() => {
    const cuantos = carrito.length;
    guardarCarrito([]);
    if (cuantos) avisar(`Se vació el carrito (${cuantos} producto${cuantos > 1 ? 's' : ''})`);
  }, [carrito, guardarCarrito, avisar]);

  /*
   * Vaciar el carrito porque el pedido YA SE HIZO.
   *
   * Hace lo mismo que `limpiarCarrito` pero sin decir nada, y ese es todo el
   * motivo de que exista: "Se vació el carrito (3 productos)" apareciendo justo
   * después de comprar se lee como que algo se perdió, cuando lo que pasó es
   * exactamente lo contrario. Ver pages/Confirmacion.js.
   */
  const vaciarTrasPedido = useCallback(() => guardarCarrito([]), [guardarCarrito]);

  // El total ya trae aplicado el NxM: la cuenta vive en utils/catalogo.js para
  // que la línea y este total no puedan discrepar.
  const totalCarrito = useMemo(
    () => carrito.reduce((total, item) => total + totalDeLinea(item), 0),
    [carrito]
  );

  const cantidadItems = useMemo(
    () => carrito.reduce((total, item) => total + item.cantidad, 0),
    [carrito]
  );

  const valor = useMemo(
    () => ({
      productos,
      cargando,
      errorCarga,
      recargar: traerCatalogo,
      pasillos,
      todosLosModulos,
      moduloSeleccionado,
      setModuloSeleccionado,
      nombrePasillo,
      productosDelPasillo,
      categorias,
      categoriaSeleccionada,
      setCategoriaSeleccionada,
      terminoBusqueda,
      setTerminoBusqueda,
      productosFiltrados,
      productosDestacados,
      secciones,
      promosDelCarrusel,
      promoSeleccionada,
      setPromoSeleccionada,
      promoDetalle,
      productosDePromo,
      abrirPromo,
      cerrarPromo,
      verPromoEnTienda,
      carrito,
      totalCarrito,
      cantidadItems,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      limpiarCarrito,
      vaciarTrasPedido,
    }),
    [
      productos, cargando, errorCarga, traerCatalogo, pasillos, todosLosModulos, moduloSeleccionado,
      nombrePasillo, productosDelPasillo, categorias, categoriaSeleccionada,
      terminoBusqueda, productosFiltrados, productosDestacados, secciones, promosDelCarrusel,
      promoSeleccionada, promoDetalle, productosDePromo, abrirPromo, cerrarPromo,
      verPromoEnTienda, carrito, totalCarrito, cantidadItems, agregarAlCarrito,
      eliminarDelCarrito, actualizarCantidad, limpiarCarrito, vaciarTrasPedido,
    ]
  );

  return <TiendaContext.Provider value={valor}>{children}</TiendaContext.Provider>;
};

export const useTienda = () => {
  const ctx = useContext(TiendaContext);
  if (!ctx) throw new Error('useTienda debe usarse dentro de <TiendaProvider>');
  return ctx;
};
