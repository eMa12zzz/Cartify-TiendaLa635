import {
  Flame, Sparkles, Star, Percent, Tag, Gift,
  CupSoda, Coffee, Apple, Leaf, Milk, Cookie,
  Croissant, IceCream, ShoppingBasket, Heart,
} from 'lucide-react';

/*
 * ============================================================
 * ICONOS DE PROMOCIÓN — iconosPromo.js
 * ============================================================
 * Un puñado de iconos para que el banner diga de qué va sin leerlo.
 *
 * Por qué una lista cerrada y no un buscador de iconos: quien arma la promo
 * es el tendero. Con 1500 iconos se pierde diez minutos y termina eligiendo
 * cualquiera; con dieciséis encuentra "llama" o "bebida" de un vistazo.
 *
 * Están ordenados por lo que más se usa: primero los de gancho (trending,
 * nuevo, estrella), después los de producto.
 * ============================================================
 */
export const ICONOS_PROMO = [
  { id: 'llama', nombre: 'Trending', Icono: Flame },
  { id: 'chispa', nombre: 'Nuevo', Icono: Sparkles },
  { id: 'estrella', nombre: 'Destacado', Icono: Star },
  { id: 'porcentaje', nombre: 'Descuento', Icono: Percent },
  { id: 'etiqueta', nombre: 'Oferta', Icono: Tag },
  { id: 'regalo', nombre: 'Regalo', Icono: Gift },
  { id: 'corazon', nombre: 'Favorito', Icono: Heart },
  { id: 'canasta', nombre: 'Canasta', Icono: ShoppingBasket },
  { id: 'bebida', nombre: 'Bebida', Icono: CupSoda },
  { id: 'cafe', nombre: 'Café', Icono: Coffee },
  { id: 'fruta', nombre: 'Fruta', Icono: Apple },
  { id: 'verdura', nombre: 'Verdura', Icono: Leaf },
  { id: 'lacteo', nombre: 'Lácteos', Icono: Milk },
  { id: 'galleta', nombre: 'Snacks', Icono: Cookie },
  { id: 'pan', nombre: 'Panadería', Icono: Croissant },
  { id: 'helado', nombre: 'Helado', Icono: IceCream },
];

// El componente del icono elegido, o null si la promo no lleva ninguno.
export const iconoDePromo = (id) => ICONOS_PROMO.find((i) => i.id === id)?.Icono || null;
