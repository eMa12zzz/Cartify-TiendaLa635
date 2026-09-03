/*
 * ============================================================
 * MÓDULOS — modulos.js
 * ============================================================
 * Puerto de `frontend/src/utils/modulos.js`. Un módulo es un PASILLO de la
 * misma tienda (panadería, farmacia...), no otra tienda: sus productos se
 * agregan al carrito igual que cualquier otro, así que no hace falta
 * pantalla, carrito ni checkout propios.
 *
 * Lo único que de verdad separa a un módulo de otro es CÓMO SE COMPRA
 * ('estandar' → al carrito y listo; 'impresiones' → pide datos antes, así
 * que tiene su propia pantalla en la web). Esa pantalla no existe en móvil
 * todavía, así que aquí solo se listan los módulos 'estandar' — ver
 * `modulosVisibles` en TiendaContext.js, que ya los deja filtrados.
 * ============================================================
 */

import {
  Store, Croissant, Utensils, BookOpen, Printer, Pill,
  Beef, Carrot, Shirt, Wrench, Cake, Coffee,
} from 'lucide-react-native';

const ICONOS_MODULO = {
  tienda: Store,
  panaderia: Croissant,
  pupuseria: Utensils,
  libreria: BookOpen,
  impresiones: Printer,
  farmacia: Pill,
  carniceria: Beef,
  verduleria: Carrot,
  ropa: Shirt,
  ferreteria: Wrench,
  pasteleria: Cake,
  cafeteria: Coffee,
};

export const iconoDeModulo = (modulo) => ICONOS_MODULO[modulo?.icono] || Store;

/*
 * Qué flujo usa el módulo. El respaldo por nombre es por los módulos que ya
 * estaban en la base sin el campo — ver el mismo comentario en la web.
 */
export const flujoDeModulo = (modulo) => {
  if (modulo?.flujo) return modulo.flujo;
  return /impres/i.test(modulo?.name || '') ? 'impresiones' : 'estandar';
};

// Activos y en el orden que puso la tienda; a igual orden, alfabético.
export const modulosVisibles = (lista) =>
  (Array.isArray(lista) ? lista : [])
    .filter((m) => String(m.isActive) !== 'false')
    .sort((a, b) => (a.orden || 0) - (b.orden || 0) || (a.name || '').localeCompare(b.name || ''));
