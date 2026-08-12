import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productService } from '../../api/Usuario/productService';
import { promotionService } from '../../api/Usuario/promotionService';
import { promoVigente, promosVisibles } from '../../utils/promos';
import { cantidadConUnidad } from '../../utils/unidades';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * useStore — estado de la tienda (catálogo real + carrito) con PROMOCIONES.
 * Puerto de `frontend/src/hooks/useStore.js`, adaptado a React Native:
 *   - localStorage + useSyncExternalStore  →  AsyncStorage + estado de React.
 *   - se guarda SOLO { id, cantidad }, nunca el precio (el precio, la promo y
 *     el stock salen siempre del catálogo recién cargado).
 *   - la búsqueda por "familias" (energizante, limpieza…) se simplifica a
 *     nombre/marca/categoría para no arrastrar los diccionarios de la web.
 */

// Los productos que toca una promo (poblados o como id).
const idsDePromo = (promo) =>
  (promo?.items || [])
    .map((it) => (typeof it.productId === 'object' ? it.productId?._id : it.productId))
    .filter(Boolean);

// Entre varias promos, el "anuncio" (solo destaca) pierde contra las que tocan el precio.
const prioridadPromo = (tipo) => (tipo === 'anuncio' ? 0 : 1);

const construirMapaPromo = (promos) => {
  const mapa = {};
  const ordenadas = (promos || [])
    .filter(promoVigente)
    .sort((a, b) =>
      prioridadPromo(b.type) - prioridadPromo(a.type) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  ordenadas.forEach((pr) => {
    (pr.items || []).forEach((it) => {
      const pid = typeof it.productId === 'object' ? it.productId?._id : it.productId;
      if (!pid || mapa[pid]) return;
      mapa[pid] = {
        type: pr.type, discount: it.discount || 0, fixedPrice: it.fixedPrice,
        buyQty: pr.buyQty || 2, payQty: pr.payQty || 1, etiqueta: pr.etiqueta || '',
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
      promoInfo = { type: 'anuncio', etiqueta: promo.etiqueta || 'Nuevo' };
    }
  }

  return {
    id: p._id,
    nombre: p.name || '',
    marca: p.brandId?.name || '',
    categoria: p.typeId?.type || 'General',
    modulo: p.moduleId?.name || '',
    moduloId: p.moduleId?._id || p.moduleId || null,
    precio, precioAnterior, promo: promoInfo,
    descripcion: p.description || '',
    unidadVenta: p.unidadVenta === 'libra' ? 'libra' : 'unidad',
    piezas: p.piezas ?? null,
    soloAdultos: !!p.soloAdultos,
    stock: Number(p.stock) || 0,
    stockMaximo: Number(p.maxQuantity) || 0,
    imagen: Array.isArray(p.image) ? p.image[0] : p.image,
    fechaExpiracion: p.expirationDate,
    creadoEn: p.createdAt,
  };
};

// Llave del carrito por persona (o "invitado" mientras no hay sesión).
const llaveCarrito = (userId) => `kartify:carrito:${userId || 'invitado'}`;

const normalizarLineas = (crudo) => {
  try {
    const datos = JSON.parse(crudo || '[]');
    if (!Array.isArray(datos)) return [];
    return datos
      .map((l) => ({ id: String(l?.id ?? ''), cantidad: Math.floor(Number(l?.cantidad) || 0) }))
      .filter((l) => l.id && l.cantidad > 0);
  } catch { return []; }
};

export const useStore = () => {
  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]); // las visibles (banners)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroPrecio, setFiltroPrecio] = useState('todos');
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);
  const [promoDetalle, setPromoDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  // ── Carga del catálogo + promociones ──
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [prods, promos] = await Promise.all([
          productService.getProducts(),
          promotionService.getPromotions().catch(() => []),
        ]);
        const activos = (Array.isArray(prods) ? prods : []).filter((p) => p.isActive !== false);
        const listaPromos = Array.isArray(promos) ? promos : [];
        const mapaPromo = construirMapaPromo(listaPromos);
        setProductos(activos.map((p) => mapearProducto(p, mapaPromo)));
        // Las promos que se anuncian en la portada (banners).
        setPromociones(promosVisibles(listaPromos));
      } catch (error) {
        console.error('Error cargando la tienda:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ── El carrito (líneas { id, cantidad }) ──
  const { user } = useAuth();
  const llave = llaveCarrito(user?.id);
  const [lineas, setLineas] = useState([]);

  // Al montar (o cambiar de usuario) se leen las líneas guardadas.
  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(llave)
      .then((crudo) => { if (vivo) setLineas(normalizarLineas(crudo)); })
      .catch(() => { if (vivo) setLineas([]); });
    return () => { vivo = false; };
  }, [llave]);

  // Guardar líneas: estado + AsyncStorage (solo id y cantidad).
  const guardarLineas = useCallback((lista) => {
    const limpias = (lista || [])
      .map((i) => ({ id: String(i.id), cantidad: Math.floor(Number(i.cantidad) || 0) }))
      .filter((l) => l.id && l.cantidad > 0);
    setLineas(limpias);
    AsyncStorage.setItem(llave, JSON.stringify(limpias)).catch(() => {});
  }, [llave]);

  /*
   * El carrito que se ve = lo guardado CASADO con el catálogo de hoy: lo que la
   * tienda dio de baja o que se quedó sin stock desaparece solo, y una cantidad
   * mayor a lo que hay se recorta.
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

  const guardarCarrito = useCallback((lista) => {
    guardarLineas((lista || []).map((i) => ({ id: i.id, cantidad: i.cantidad })));
  }, [guardarLineas]);

  // ── Filtros ──
  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productos;
    if (promoSeleccionada) {
      const ids = idsDePromo(promoSeleccionada);
      filtrados = filtrados.filter((p) => ids.includes(p.id));
    }
    if (categoriaSeleccionada) {
      filtrados = filtrados.filter((p) => p.categoria === categoriaSeleccionada);
    }
    if (terminoBusqueda.trim()) {
      const b = terminoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter((p) =>
        p.nombre?.toLowerCase().includes(b) ||
        p.marca?.toLowerCase().includes(b) ||
        p.categoria?.toLowerCase().includes(b)
      );
    }
    if (filtroPrecio === '0-4') filtrados = filtrados.filter((p) => p.precio <= 4);
    else if (filtroPrecio === '4-12') filtrados = filtrados.filter((p) => p.precio > 4 && p.precio <= 12);
    else if (filtroPrecio === '12+') filtrados = filtrados.filter((p) => p.precio > 12);
    return filtrados;
  }, [productos, categoriaSeleccionada, terminoBusqueda, filtroPrecio, promoSeleccionada]);

  const productosDestacados = useMemo(() => productos.slice(0, 6), [productos]);

  const productosDePromo = useMemo(() => {
    if (!promoDetalle) return [];
    const ids = idsDePromo(promoDetalle);
    return productos.filter((p) => ids.includes(p.id));
  }, [productos, promoDetalle]);

  const abrirPromo = (promo) => setPromoDetalle(promo);
  const cerrarPromo = () => setPromoDetalle(null);
  const verPromoEnTienda = (promo) => {
    setPromoSeleccionada(promo || promoDetalle);
    setCategoriaSeleccionada(null);
    setTerminoBusqueda('');
    setPromoDetalle(null);
  };

  // ── Operaciones del carrito ──
  const agregarAlCarrito = (producto, cantidad = 1) => {
    if (!producto?.id) return;
    const stock = Number(producto.stock) || 0;
    if (stock <= 0) { aviso(`${producto.nombre} se quedó sin existencias`); return; }

    const enCarrito = carrito.find((i) => i.id === producto.id)?.cantidad || 0;
    const nuevaCantidad = enCarrito + cantidad;
    if (nuevaCantidad > stock) {
      aviso(`Solo hay ${cantidadConUnidad(producto, stock)} disponibles`);
      return;
    }
    guardarCarrito(
      enCarrito
        ? carrito.map((item) => (item.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item))
        : [...carrito, { ...producto, cantidad }]
    );
    aviso(
      nuevaCantidad > 1
        ? `${producto.nombre} · ${cantidadConUnidad(producto, nuevaCantidad)} en el carrito`
        : `${producto.nombre} agregado al carrito`
    );
  };

  const eliminarDelCarrito = (productoId) => {
    const fuera = carrito.find((i) => i.id === productoId);
    guardarCarrito(carrito.filter((item) => item.id !== productoId));
    aviso(fuera ? `${fuera.nombre} salió del carrito` : 'Producto eliminado');
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) { eliminarDelCarrito(productoId); return; }
    const item = carrito.find((i) => i.id === productoId);
    if (!item) return;
    const cantidad = Math.min(nuevaCantidad, item.stock);
    if (cantidad === item.cantidad) return;
    guardarCarrito(carrito.map((i) => (i.id === productoId ? { ...i, cantidad } : i)));
  };

  const limpiarCarrito = () => {
    const cuantos = carrito.length;
    guardarCarrito([]);
    if (cuantos) aviso(`Se vació el carrito (${cuantos} producto${cuantos > 1 ? 's' : ''})`);
  };

  // Total con el NxM (cada N unidades, se pagan M).
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
    productos, promociones, categorias,
    categoriaSeleccionada, setCategoriaSeleccionada,
    terminoBusqueda, setTerminoBusqueda,
    filtroPrecio, setFiltroPrecio,
    productosFiltrados, productosDestacados,
    carrito, totalCarrito, cantidadItems,
    agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    cargando,
    promoSeleccionada, setPromoSeleccionada,
    promoDetalle, productosDePromo, abrirPromo, cerrarPromo, verPromoEnTienda,
  };
};

export default useStore;
