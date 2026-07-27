import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../api/productService';
import { promotionService } from '../api/promotionService';
import { promoVigente } from '../utils/promos';

/*
 * useStore — estado de la tienda (catálogo real + carrito) con PROMOCIONES.
 *
 * Al cargar, trae productos y promociones, y aplica a cada producto su promo:
 *   - descuento   → precio con % de descuento (precioAnterior = original).
 *   - precio_fijo → precio fijo de oferta      (precioAnterior = original).
 *   - nxm         → precio normal, pero el CARRITO cobra "compra N paga M".
 */

// Los productos que toca una promo, ya vengan poblados o como puro id.
export const idsDePromo = (promo) =>
  (promo?.items || [])
    .map((it) => (typeof it.productId === 'object' ? it.productId?._id : it.productId))
    .filter(Boolean);

/*
 * Mapa productId -> info de promo (la primera promo vigente que lo incluya).
 * "Vigente" incluye la fecha: una promo que venció anoche no puede seguir
 * bajando precios hoy solo porque nadie recargó la lista.
 */
const construirMapaPromo = (promos) => {
  const mapa = {};
  (promos || []).filter(promoVigente).forEach((pr) => {
    (pr.items || []).forEach((it) => {
      const pid = typeof it.productId === 'object' ? it.productId?._id : it.productId;
      if (!pid || mapa[pid]) return;
      mapa[pid] = {
        type: pr.type,
        discount: it.discount || 0,
        fixedPrice: it.fixedPrice,
        buyQty: pr.buyQty || 2,
        payQty: pr.payQty || 1,
        // Solo el anuncio la trae: es su sello, ya que no tiene ahorro.
        etiqueta: pr.etiqueta || '',
      };
    });
  });
  return mapa;
};

// Adapta un producto real al formato de la tienda, aplicando su promo si tiene.
const mapearProducto = (p, mapaPromo = {}) => {
  const base = Number(p.salePrice) || 0;
  const promo = mapaPromo[p._id];
  let precio = base;
  let precioAnterior = null;
  let promoInfo = null;

  if (promo) {
    if (promo.type === 'descuento' && promo.discount > 0) {
      precio = Number((base * (1 - promo.discount / 100)).toFixed(2));
      precioAnterior = base;
      promoInfo = { type: 'descuento', discount: promo.discount };
    } else if (promo.type === 'precio_fijo' && promo.fixedPrice != null && promo.fixedPrice !== '') {
      precio = Number(promo.fixedPrice);
      precioAnterior = base;
      promoInfo = { type: 'precio_fijo' };
    } else if (promo.type === 'nxm') {
      promoInfo = { type: 'nxm', buyQty: promo.buyQty, payQty: promo.payQty };
    } else if (promo.type === 'anuncio') {
      /*
       * El anuncio NO toca el precio: solo le pone su sello al producto para
       * que destaque en la tienda. Por eso no se define precioAnterior — si no,
       * la tarjeta mostraría un precio tachado igual al vigente.
       */
      promoInfo = { type: 'anuncio', etiqueta: promo.etiqueta || 'Nuevo' };
    }
  }

  return {
    id: p._id,
    nombre: p.name || '',
    marca: p.brandId?.name || '',
    categoria: p.typeId?.type || 'General',
    modulo: p.moduleId?.name || '',
    // El id además del nombre: filtrar por pasillo con el nombre se rompía en
    // cuanto alguien le corregía una tilde al módulo.
    moduloId: p.moduleId?._id || p.moduleId || null,
    precio,
    precioAnterior,
    promo: promoInfo,
    descripcion: p.description || '',
    stock: Number(p.stock) || 0,
    // Tope de stock del producto: sirve para saber si "se está acabando"
    // en relación a lo que normalmente tiene, no contra un número fijo.
    stockMaximo: Number(p.maxQuantity) || 0,
    imagen: Array.isArray(p.image) ? p.image[0] : p.image,
    esMasVendido: false,
    fechaExpiracion: p.expirationDate,
    creadoEn: p.createdAt,
  };
};

export const useStore = ({ moduloInicial = null } = {}) => {
  const [productos, setProductos] = useState([]);
  /*
   * El pasillo en el que está parado el cliente. null = toda la tienda.
   * Viene de la pantalla de servicios (?modulo=) o de las pastillas de arriba.
   */
  const [moduloSeleccionado, setModuloSeleccionado] = useState(moduloInicial);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroPrecio, setFiltroPrecio] = useState('todos');
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);
  // Promo abierta en la ventana de detalle (el click al banner del carrusel).
  const [promoDetalle, setPromoDetalle] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [prods, promos] = await Promise.all([
          productService.getProducts(),
          promotionService.getPromotions().catch(() => []),
        ]);
        const activos = (Array.isArray(prods) ? prods : []).filter((p) => p.isActive !== false);
        const mapaPromo = construirMapaPromo(Array.isArray(promos) ? promos : []);
        setProductos(activos.map((p) => mapearProducto(p, mapaPromo)));
      } catch (error) {
        console.error('Error cargando la tienda:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  /*
   * Escape cierra el detalle de la promo. El listener vive acá y no en el
   * componente porque el estado de apertura también vive acá: la ventana solo
   * pinta lo que el hook le dice.
   */
  useEffect(() => {
    if (!promoDetalle) return;
    const alTeclear = (e) => { if (e.key === 'Escape') setPromoDetalle(null); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [promoDetalle]);

  /*
   * El pasillo manda sobre todo lo demás: si el cliente entró a la Panadería,
   * las categorías, los destacados y la búsqueda son de la panadería. Por eso
   * el filtro de módulo se aplica ANTES que cualquier otro y todo lo demás
   * cuelga de aquí.
   */
  const productosDelPasillo = useMemo(() => {
    if (!moduloSeleccionado) return productos;
    return productos.filter((p) => String(p.moduloId) === String(moduloSeleccionado));
  }, [productos, moduloSeleccionado]);

  // Al cambiar de pasillo se suelta la categoría: la de la panadería no existe
  // en abarrotes, y la lista quedaría vacía sin explicación.
  useEffect(() => { setCategoriaSeleccionada(null); }, [moduloSeleccionado]);

  const categorias = useMemo(() => {
    const cats = new Set(productosDelPasillo.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productosDelPasillo]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productosDelPasillo;

    // Filtro por promo (banner): solo los productos de esa promo.
    if (promoSeleccionada) {
      const ids = idsDePromo(promoSeleccionada);
      filtrados = filtrados.filter((p) => ids.includes(p.id));
    }

    if (categoriaSeleccionada) {
      filtrados = filtrados.filter((p) => p.categoria === categoriaSeleccionada);
    }

    if (terminoBusqueda.trim()) {
      const busqueda = terminoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter((p) =>
        p.nombre?.toLowerCase().includes(busqueda) ||
        p.marca?.toLowerCase().includes(busqueda) ||
        p.categoria?.toLowerCase().includes(busqueda)
      );
    }

    if (filtroPrecio === '0-4') {
      filtrados = filtrados.filter((p) => p.precio <= 4);
    } else if (filtroPrecio === '4-12') {
      filtrados = filtrados.filter((p) => p.precio > 4 && p.precio <= 12);
    } else if (filtroPrecio === '12+') {
      filtrados = filtrados.filter((p) => p.precio > 12);
    }

    return filtrados;
  }, [productosDelPasillo, categoriaSeleccionada, terminoBusqueda, filtroPrecio, promoSeleccionada]);

  const productosDestacados = useMemo(() => productosDelPasillo.slice(0, 6), [productosDelPasillo]);

  /*
   * Los productos de la promo que se está mirando en detalle. Salen del
   * catálogo ya mapeado, no de promo.items, para que se vean con su precio de
   * oferta y su stock real — los mismos que verá en la tienda.
   */
  const productosDePromo = useMemo(() => {
    if (!promoDetalle) return [];
    const ids = idsDePromo(promoDetalle);
    return productos.filter((p) => ids.includes(p.id));
  }, [productos, promoDetalle]);

  // Abrir el detalle de una promo (click al banner) y cerrarlo.
  const abrirPromo = (promo) => setPromoDetalle(promo);
  const cerrarPromo = () => setPromoDetalle(null);

  /*
   * "Ver todos en la tienda": cierra el detalle y deja la lista filtrada a esa
   * promo, limpiando categoría y búsqueda para que no se peleen entre filtros.
   */
  const verPromoEnTienda = (promo) => {
    setPromoSeleccionada(promo || promoDetalle);
    setCategoriaSeleccionada(null);
    setTerminoBusqueda('');
    setPromoDetalle(null);
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        const nuevaCantidad = existe.cantidad + cantidad;
        if (nuevaCantidad > producto.stock) {
          toast.error(`Solo hay ${producto.stock} unidades disponibles`);
          return prev;
        }
        return prev.map((item) => (item.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item));
      }
      return [...prev, { ...producto, cantidad }];
    });
    toast.success(`¡${producto.nombre} agregado al carrito!`, {
      icon: '🛒',
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito((prev) => prev.filter((item) => item.id !== productoId));
    toast('Producto eliminado', { icon: '🗑️' });
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    setCarrito((prev) => prev.map((item) => (item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item)));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    toast('Carrito vaciado', { icon: '🗑️' });
  };

  // Total del carrito, aplicando el NxM (cada N unidades, se pagan M).
  const totalCarrito = useMemo(
    () => carrito.reduce((total, item) => {
      if (item.promo?.type === 'nxm') {
        const b = item.promo.buyQty || 2;
        const m = item.promo.payQty || 1;
        const grupos = Math.floor(item.cantidad / b);
        const pagados = grupos * m + (item.cantidad % b);
        return total + item.precio * pagados;
      }
      return total + item.precio * item.cantidad;
    }, 0),
    [carrito]
  );

  const cantidadItems = useMemo(
    () => carrito.reduce((total, item) => total + item.cantidad, 0),
    [carrito]
  );

  return {
    productos,
    productosDelPasillo,
    moduloSeleccionado,
    setModuloSeleccionado,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    terminoBusqueda,
    setTerminoBusqueda,
    productosFiltrados,
    productosDestacados,
    carrito,
    totalCarrito,
    cantidadItems,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    limpiarCarrito,
    cargando,
    filtroPrecio,
    setFiltroPrecio,
    promoSeleccionada,
    setPromoSeleccionada,
    promoDetalle,
    productosDePromo,
    abrirPromo,
    cerrarPromo,
    verPromoEnTienda,
  };
};
