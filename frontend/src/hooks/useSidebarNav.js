import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package,
  Shapes, Tag, Blocks, Printer,
  Megaphone, Award, Gift,
  UserSquare2, Users, Truck,
  Library, Store, Contact,
} from 'lucide-react';

/*
 * ============================================================
 * NAVEGACIÓN DEL PANEL — useSidebarNav.js
 * ============================================================
 * El menú tenía trece entradas planas, todas del mismo tamaño y del mismo
 * peso visual. Encontrar "Pedidos" costaba lo mismo que encontrar "Módulos",
 * aunque uno se abre cuarenta veces al día y el otro dos veces al año.
 *
 * Ahora hay dos niveles:
 *   - ACCESOS: lo del día a día, siempre a la vista y sin un clic de más.
 *   - GRUPOS:  lo que se configura de vez en cuando, plegado por defecto.
 *
 * De trece filas se pasa a seis. El grupo donde uno está parado se abre solo,
 * así que nunca hay que adivinar dónde quedó la pantalla en la que se está.
 * ============================================================
 */

// Lo que el encargado abre todos los días: ventas y existencias.
export const ACCESOS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', path: '/pedidos', icon: ShoppingBag },
  { name: 'Inventario', path: '/inventario', icon: Package },
];

/*
 * Lo demás, agrupado por la pregunta que responde:
 *   Catálogo → "¿cómo está organizado lo que vendo?"
 *   Ventas   → "¿cómo hago que compren más?"
 *   Personas → "¿con quién trato?"
 */
export const GRUPOS = [
  {
    id: 'catalogo',
    name: 'Catálogo',
    icon: Library,
    items: [
      { name: 'Categorías', path: '/categorias', icon: Shapes },
      { name: 'Marcas', path: '/marcas', icon: Tag },
      { name: 'Módulos', path: '/modulos', icon: Blocks },
      { name: 'Impresiones', path: '/servicios-impresion', icon: Printer },
    ],
  },
  {
    id: 'ventas',
    name: 'Ventas',
    icon: Store,
    items: [
      { name: 'Promociones', path: '/promociones', icon: Megaphone },
      { name: 'Fidelidad', path: '/fidelidad', icon: Award },
      { name: 'Tarjetas de regalo', path: '/tarjetas', icon: Gift },
    ],
  },
  {
    id: 'personas',
    name: 'Personas',
    icon: Contact,
    items: [
      { name: 'Clientes', path: '/clientes', icon: UserSquare2 },
      { name: 'Empleados', path: '/empleados', icon: Users },
      { name: 'Proveedores', path: '/proveedores', icon: Truck },
    ],
  },
];

export const useSidebarNav = () => {
  const { pathname } = useLocation();

  // Lo que el usuario abrió o cerró a mano; vale más que el automático.
  const [forzados, setForzados] = useState({});

  /*
   * Al cambiar de pantalla se olvidan los forzados. Si no, un grupo que se
   * cerró a mano seguiría cerrado al entrar a una de sus pantallas, y el menú
   * mentiría sobre dónde está uno parado.
   */
  useEffect(() => { setForzados({}); }, [pathname]);

  const esActivo = (path) => pathname.includes(path);
  const tieneActivo = (grupo) => grupo.items.some((i) => esActivo(i.path));

  const estaAbierto = (grupo) => forzados[grupo.id] ?? tieneActivo(grupo);
  const alternar = (grupo) => setForzados((prev) => ({ ...prev, [grupo.id]: !estaAbierto(grupo) }));

  return { accesos: ACCESOS, grupos: GRUPOS, esActivo, tieneActivo, estaAbierto, alternar };
};
