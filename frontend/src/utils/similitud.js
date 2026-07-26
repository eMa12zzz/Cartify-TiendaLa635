/*
 * ============================================================
 * SIMILITUD ENTRE PRODUCTOS — similitud.js
 * ============================================================
 * Decide qué tan parecidos son dos productos, sin inteligencia artificial ni
 * nada raro: puros datos que la tienda ya llena en el admin.
 *
 * Por qué el nombre pesa tanto:
 * en la base real hay productos sin categoría y sin marca (se agregaron
 * rápido y esos campos quedaron vacíos). Si el parecido dependiera solo de la
 * categoría, medio catálogo no tendría con qué relacionarse. En cambio
 * "Queso Cheddar" y "Queso Mozzarella" comparten la palabra que importa, y ahí
 * el parecido es obvio hasta para una persona.
 * ============================================================
 */

// Palabras que aparecen en todos lados y no dicen nada del producto.
const VACIAS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'sin', 'para', 'por', 'y', 'en',
  'al', 'un', 'una', 'unos', 'unas', 'ml', 'lt', 'lts', 'kg', 'gr', 'grs', 'oz',
  'lb', 'lbs', 'pack', 'unidad', 'unidades', 'grande', 'pequeno', 'mediano',
]);

const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/*
 * Parte el nombre en las palabras que de verdad describen el producto.
 * "Gaseosa Cola 1.5 Lt" -> ['gaseosa', 'cola']
 */
export const palabrasClave = (nombre) =>
  sinTildes(nombre)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !VACIAS.has(p) && !/^\d+$/.test(p));

const id = (v) => (v && typeof v === 'object' ? v._id : v) || null;

/*
 * Puntaje de parecido entre dos productos (0 = nada que ver).
 * Los pesos están ordenados por qué tan fuerte es la señal en una tienda de
 * abarrotes: compartir el nombre y la categoría manda; el precio solo desempata.
 */
export const puntajeSimilitud = (a, b) => {
  if (!a || !b || a.id === b.id) return 0;
  let puntos = 0;

  // 1. Palabras del nombre — la señal más fuerte y la que siempre está.
  const pa = palabrasClave(a.nombre || a.name);
  const pb = new Set(palabrasClave(b.nombre || b.name));
  const comunes = pa.filter((p) => pb.has(p)).length;
  if (comunes) puntos += 40 + (comunes - 1) * 15; // dos palabras iguales es mucho más que una

  // 2. Misma categoría.
  const catA = id(a.typeId) || a.categoria;
  const catB = id(b.typeId) || b.categoria;
  if (catA && catB && catA === catB) puntos += 35;

  // 3. Misma marca.
  const marcaA = id(a.brandId) || a.marca;
  const marcaB = id(b.brandId) || b.marca;
  if (marcaA && marcaB && marcaA === marcaB) puntos += 20;

  // 4. Mismo módulo (tienda / impresiones): evita mezclar peras con servicios.
  const modA = id(a.moduleId);
  const modB = id(b.moduleId);
  if (modA && modB && modA !== modB) return 0;

  // 5. Precio parecido (±30%). Desempata entre varios de la misma categoría.
  const precioA = Number(a.precio ?? a.salePrice) || 0;
  const precioB = Number(b.precio ?? b.salePrice) || 0;
  if (precioA > 0 && precioB > 0) {
    const razon = Math.min(precioA, precioB) / Math.max(precioA, precioB);
    if (razon >= 0.7) puntos += 12;
  }

  return puntos;
};

/*
 * Los N productos más parecidos a uno dado. El umbral evita el caso feo de
 * "productos similares" mostrando cosas que no tienen nada que ver solo por
 * rellenar la fila: si no hay parecidos de verdad, devuelve menos (o ninguno).
 */
export const productosSimilares = (producto, catalogo, cantidad = 6, umbral = 20) =>
  (catalogo || [])
    .map((otro) => ({ otro, puntos: puntajeSimilitud(producto, otro) }))
    .filter((x) => x.puntos >= umbral)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, cantidad)
    .map((x) => x.otro);

/*
 * Agrupa el catálogo por "familias" de productos parecidos, para armar filas
 * temáticas solas. Ej: {"queso": [Cheddar, Mozzarella], "gaseosa": [Cola, ...]}
 * Solo devuelve grupos con al menos `minimo` productos: un grupo de uno no es
 * una sección, es un producto suelto.
 */
export const agruparPorFamilia = (catalogo, minimo = 3) => {
  const familias = new Map();

  (catalogo || []).forEach((p) => {
    // La primera palabra significativa suele ser el tipo: "Queso", "Gaseosa".
    const raiz = palabrasClave(p.nombre || p.name)[0];
    if (!raiz) return;
    if (!familias.has(raiz)) familias.set(raiz, []);
    familias.get(raiz).push(p);
  });

  return [...familias.entries()]
    .filter(([, lista]) => lista.length >= minimo)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([raiz, lista]) => ({
      // "queso" -> "Queso" para el título de la sección.
      titulo: raiz.charAt(0).toUpperCase() + raiz.slice(1),
      productos: lista,
    }));
};
