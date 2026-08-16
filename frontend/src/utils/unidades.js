/*
 * ============================================================
 * CÓMO SE VENDE CADA PRODUCTO — unidades.js
 * ============================================================
 * Hay dos formas de vender en la tienda y hasta ahora solo existía una.
 *
 *   Por UNIDAD  → una Coca-Cola, un paquete de Takis. El stock son piezas y
 *                 el precio es el de la pieza.
 *   Por LIBRA   → tomates, queso fresco, frijol a granel. El stock son libras
 *                 —y puede ser 3.5— y el precio es el de UNA libra.
 *
 * El problema que resuelve: no había dónde decirlo. Quien cargaba tomates
 * escribía "se vende por libra" en la descripción y cruzaba los dedos para que
 * el cliente lo leyera. El precio salía como "$1.25" a secas, que para un
 * tomate suelto se lee como el precio del tomate, no el de la libra. Eso no es
 * un detalle de forma: es cobrar una cosa y aparentar otra.
 *
 * Todo lo que decide cómo se ve una u otra vive AQUÍ, para que el panel, la
 * tienda, el carrito y el recibo digan lo mismo. La regla que se repite en
 * seis archivos es la regla que en el séptimo sale distinta.
 * ============================================================
 */

export const UNIDADES = [
  {
    clave: 'unidad',
    nombre: 'Por unidad',
    descripcion: 'Piezas sueltas: una botella, un paquete, una bolsa.',
    // Cómo se llama lo que hay en bodega y lo que se lleva el cliente.
    existencia: 'Unidades',
    corto: 'u',
    // Media botella no se vende; media libra de queso, todos los días.
    fraccionable: false,
    paso: 1,
  },
  {
    clave: 'libra',
    nombre: 'Por libra',
    descripcion: 'A granel y por peso: verduras, quesos, granos básicos.',
    existencia: 'Libras',
    corto: 'lb',
    fraccionable: true,
    // Media libra es la fracción con la que se pide de verdad en el mostrador.
    paso: 0.5,
  },
];

const POR_DEFECTO = UNIDADES[0];

/*
 * La unidad de un producto. Todo lo que no diga expresamente "libra" es por
 * unidad: son miles de productos ya cargados sin este campo, y asumir lo
 * contrario los pondría todos a venderse por peso de un día para otro.
 */
export const unidadDe = (producto) =>
  UNIDADES.find((u) => u.clave === producto?.unidadVenta) || POR_DEFECTO;

export const esPorLibra = (producto) => unidadDe(producto).clave === 'libra';

/*
 * El precio, escrito como se cobra. "$1.25" y "$1.25/lb" son dos precios
 * distintos aunque el número sea el mismo.
 */
export const precioConUnidad = (producto, precio) => {
  const monto = `$${Number(precio ?? producto?.salePrice ?? 0).toFixed(2)}`;
  return esPorLibra(producto) ? `${monto}/lb` : monto;
};

/*
 * Una cantidad con su unidad: "3 u" o "3.5 lb". Los enteros salen sin el ".0"
 * de adorno — "3.0 lb" hace dudar de si el sistema entendió bien.
 */
export const cantidadConUnidad = (producto, cantidad) => {
  const n = Number(cantidad) || 0;
  const u = unidadDe(producto);
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');
  return `${texto} ${u.corto}`;
};

/*
 * Cuánto sube o baja el "+" / "−". Por libra va de media en media, que es como
 * se pide en el mostrador; por unidad, de uno en uno.
 */
export const pasoDe = (producto) => unidadDe(producto).paso;

/*
 * Redondea al paso de su unidad. Sin esto, un carrito con 0.5 lb más 0.5 lb
 * más 0.1 termina en 1.1000000000000001 por la aritmética de coma flotante, y
 * eso llega hasta el recibo.
 */
/*
 * El campo `piezas` dice DOS cosas parecidas pero distintas, según cómo se
 * venda el producto — y por eso cada una tiene su propio texto:
 *
 *   Por libra  → en cuántos bultos está la existencia. 15 libras de queso
 *                pueden ser tres bloques o veinte porciones, y eso cambia cómo
 *                se acomoda la vitrina y qué se le pide al proveedor.
 *   Por unidad → cuántas trae CADA producto. Un six-pack trae 6, una bolsa de
 *                churros trae 12. Al cliente le sirve para comparar precios:
 *                $3.00 no dice lo mismo si son 6 latas que si es una.
 *
 * Devuelve null cuando no se declaró — es opcional a propósito, y "0 piezas"
 * diría algo falso.
 */
export const piezasEnTexto = (producto) => {
  const n = Number(producto?.piezas);
  if (!Number.isFinite(n) || n <= 0) return null;

  return esPorLibra(producto)
    ? `${n} ${n === 1 ? 'pieza' : 'piezas'}`
    : `Trae ${n} ${n === 1 ? 'unidad' : 'unidades'}`;
};

/* La etiqueta del campo en el formulario, que también cambia de sentido. */
export const etiquetaPiezas = (unidadClave) =>
  unidadClave === 'libra'
    ? { titulo: 'Piezas', ayuda: 'En cuántos bloques o bolsas están esas libras.', pista: '¿En cuántas va?' }
    : { titulo: '¿Cuántas trae?', ayuda: 'Cuántas unidades vienen dentro: un six-pack trae 6.', pista: 'Unidades por paquete' };

/* Venta restringida a mayores de edad: licores, cigarros. */
export const esSoloAdultos = (producto) => !!producto?.soloAdultos;

export const ajustarCantidad = (producto, cantidad) => {
  const paso = pasoDe(producto);
  const n = Math.max(0, Number(cantidad) || 0);
  return Math.round(n / paso) * paso;
};
