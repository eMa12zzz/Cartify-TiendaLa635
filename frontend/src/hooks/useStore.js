import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

const productosIniciales = [
  {
    id: 1,
    nombre: 'Churritos Diana',
    marca: 'DIANA',
    categoria: 'Snacks',
    precio: 0.20,
    precioAnterior: 0.25,
    descripcion: '¡El clásico sabor que a todos encanta! Crujientes palitos de maíz con el delicioso e inconfundible toque de queso Diana.',
    stock: 95,
    imagen: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&q=80',
    emoji: '🌽',
    esMasVendido: true,
    fechaExpiracion: '2027-06-15'
  },
  {
    id: 2,
    nombre: 'Pan Blanco Bimbo',
    marca: 'BIMBO',
    categoria: 'Pan',
    precio: 2.00,
    precioAnterior: 2.50,
    descripcion: 'Pan blanco ideal para tus sándwiches diarios. Suave y esponjoso.',
    stock: 20,
    imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    emoji: '🍞',
    esMasVendido: false,
    fechaExpiracion: '2026-10-20'
  },
  {
    id: 3,
    nombre: 'Queso Crema Lala',
    marca: 'LALA',
    categoria: 'Lácteos',
    precio: 3.50,
    precioAnterior: 4.00,
    descripcion: 'Queso crema suave y cremoso, perfecto para untar en pan o usar en tus recetas favoritas.',
    stock: 15,
    imagen: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
    emoji: '🧀',
    esMasVendido: true,
    fechaExpiracion: '2026-08-10'
  },
  {
    id: 4,
    nombre: 'Yogurt Fresa Lala',
    marca: 'LALA',
    categoria: 'Lácteos',
    precio: 1.50,
    precioAnterior: 1.80,
    descripcion: 'Delicioso yogurt de fresa con trozos de fruta real. Ideal para un desayuno saludable.',
    stock: 30,
    imagen: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    emoji: '🥛',
    esMasVendido: false,
    fechaExpiracion: '2026-07-05'
  },
  {
    id: 5,
    nombre: 'Galletas Emperador',
    marca: 'GAMESA',
    categoria: 'Snacks',
    precio: 0.80,
    precioAnterior: 1.00,
    descripcion: 'Galletas con sabor a chocolate, cubiertas con una capa de crema. ¡El clásico que nunca falla!',
    stock: 45,
    imagen: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    emoji: '🍪',
    esMasVendido: false,
    fechaExpiracion: '2026-09-15'
  },
  {
    id: 6,
    nombre: 'Manzana Roja',
    marca: 'FRESCO',
    categoria: 'Frutas',
    precio: 0.60,
    precioAnterior: 0.75,
    descripcion: 'Manzana roja crujiente y dulce. Fresca y deliciosa.',
    stock: 50,
    imagen: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80',
    emoji: '🍎',
    esMasVendido: true,
    fechaExpiracion: '2026-07-20'
  },
  {
    id: 7,
    nombre: 'Naranja Valencia',
    marca: 'FRESCO',
    categoria: 'Frutas',
    precio: 0.40,
    precioAnterior: 0.50,
    descripcion: 'Naranja dulce y jugosa, ideal para jugo o comer en fresco.',
    stock: 60,
    imagen: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
    emoji: '🍊',
    esMasVendido: false,
    fechaExpiracion: '2026-07-25'
  },
  {
    id: 8,
    nombre: 'Uvas Verdes',
    marca: 'FRESCO',
    categoria: 'Frutas',
    precio: 1.20,
    precioAnterior: 1.50,
    descripcion: 'Uvas verdes sin semillas, dulces y refrescantes.',
    stock: 25,
    imagen: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80',
    emoji: '🍇',
    esMasVendido: false,
    fechaExpiracion: '2026-07-15'
  },
  {
    id: 9,
    nombre: 'Fresas',
    marca: 'FRESCO',
    categoria: 'Frutas',
    precio: 1.80,
    precioAnterior: 2.20,
    descripcion: 'Fresas rojas y dulces, perfectas para postres o comer solas.',
    stock: 18,
    imagen: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
    emoji: '🍓',
    esMasVendido: true,
    fechaExpiracion: '2026-07-10'
  },
  {
    id: 10,
    nombre: 'Plátano',
    marca: 'FRESCO',
    categoria: 'Frutas',
    precio: 0.35,
    precioAnterior: 0.45,
    descripcion: 'Plátano maduro, dulce y con alto contenido de potasio.',
    stock: 40,
    imagen: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    emoji: '🍌',
    esMasVendido: false,
    fechaExpiracion: '2026-07-18'
  },
  {
    id: 11,
    nombre: 'Leche Entera Lala',
    marca: 'LALA',
    categoria: 'Lácteos',
    precio: 1.25,
    precioAnterior: 1.50,
    descripcion: 'Leche entera pasteurizada, rica en calcio y vitaminas esenciales.',
    stock: 35,
    imagen: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
    emoji: '🥛',
    esMasVendido: true,
    fechaExpiracion: '2026-07-30'
  },
  {
    id: 12,
    nombre: 'Refresco Cola',
    marca: 'TROPICAL',
    categoria: 'Bebidas',
    precio: 0.75,
    precioAnterior: 1.00,
    descripcion: 'Refresco carbonatado sabor cola. Refrescante y delicioso.',
    stock: 80,
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    emoji: '🥤',
    esMasVendido: false,
    fechaExpiracion: '2027-01-10'
  }
];

export const useStore = () => {
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroPrecio, setFiltroPrecio] = useState('todos'); // 'todos' | '0-4' | '4-12' | '12+'

  useEffect(() => {
    setCargando(true);
    setTimeout(() => {
      setProductos(productosIniciales);
      setCargando(false);
    }, 300);
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria));
    return Array.from(cats).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productos;

    if (categoriaSeleccionada) {
      filtrados = filtrados.filter(p => p.categoria === categoriaSeleccionada);
    }

    if (terminoBusqueda.trim()) {
      const busqueda = terminoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(busqueda) ||
        p.marca.toLowerCase().includes(busqueda) ||
        p.categoria.toLowerCase().includes(busqueda)
      );
    }

    if (filtroPrecio === '0-4') {
      filtrados = filtrados.filter(p => p.precio <= 4);
    } else if (filtroPrecio === '4-12') {
      filtrados = filtrados.filter(p => p.precio > 4 && p.precio <= 12);
    } else if (filtroPrecio === '12+') {
      filtrados = filtrados.filter(p => p.precio > 12);
    }

    return filtrados;
  }, [productos, categoriaSeleccionada, terminoBusqueda, filtroPrecio]);

  const productosDestacados = useMemo(() => {
    return productos.filter(p => p.esMasVendido).slice(0, 6);
  }, [productos]);

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        const nuevaCantidad = existe.cantidad + cantidad;
        if (nuevaCantidad > producto.stock) {
          toast.error(`Solo hay ${producto.stock} unidades disponibles`);
          return prev;
        }
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: nuevaCantidad }
            : item
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
    toast.success(`¡${producto.nombre} agregado al carrito!`, {
      icon: '🛒',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(item => item.id !== productoId));
    toast('Producto eliminado', { icon: '🗑️' });
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    setCarrito(prev =>
      prev.map(item =>
        item.id === productoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    toast('Carrito vaciado', { icon: '🗑️' });
  };

  const totalCarrito = useMemo(() => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [carrito]);

  const cantidadItems = useMemo(() => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  }, [carrito]);

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
  };
};