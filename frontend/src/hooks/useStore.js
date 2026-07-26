import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../api/productService';
import { promotionService } from '../api/promotionService';

/*
 * useStore — estado de la tienda (catálogo real + carrito) con PROMOCIONES.
 *
 * Al cargar, trae productos y promociones, y aplica a cada producto su promo:
 *   - descuento   → precio con % de descuento (precioAnterior = original).
 *   - precio_fijo → precio fijo de oferta      (precioAnterior = original).
 *   - nxm         → precio normal, pero el CARRITO cobra "compra N paga M".
 */

// Mapa productId -> info de promo (nos quedamos con la primera promo activa que lo incluya).
const construirMapaPromo = (promos) => {
  const mapa = {};
  (promos || []).filter((pr) => pr.isActive !== false).forEach((pr) => {
    (pr.items || []).forEach((it) => {
      const pid = typeof it.productId === 'object' ? it.productId?._id : it.productId;
      if (!pid || mapa[pid]) return;
      mapa[pid] = {
        type: pr.type,
        discount: it.discount || 0,
        fixedPrice: it.fixedPrice,
        buyQty: pr.buyQty || 2,
        payQty: pr.payQty || 1,
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
    }
  }

  return {
    id: p._id,
    nombre: p.name || '',
    marca: p.brandId?.name || '',
    categoria: p.typeId?.type || 'General',
    modulo: p.moduleId?.name || '',
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

export const useStore = () => {
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroPrecio, setFiltroPrecio] = useState('todos');
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);

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

  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productos;

    // Filtro por promo (banner): solo los productos de esa promo.
    if (promoSeleccionada) {
      const ids = (promoSeleccionada.items || []).map((it) => (typeof it.productId === 'object' ? it.productId?._id : it.productId));
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
  }, [productos, categoriaSeleccionada, terminoBusqueda, filtroPrecio, promoSeleccionada]);

  const productosDestacados = useMemo(() => productos.slice(0, 6), [productos]);

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
  };
};
