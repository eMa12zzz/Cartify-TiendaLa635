import { useMemo } from 'react';
import { agruparPorFamilia } from '../utils/similitud';

/*
 * useSeccionesTienda — arma solas las filas de la portada de la tienda.
 *
 * La idea: que el empleado no tenga que configurar nada. Sube productos en el
 * admin y las secciones aparecen a partir de esos datos. Si mañana la tienda
 * empieza a vender pupusas, va a salir sola una fila "Pupusas" sin tocar código.
 *
 * Las filas están tomadas de lo que hacen bien las tiendas en línea grandes,
 * quedándonos solo con lo que tiene sentido en una tienda de barrio:
 *
 *   - "Volver a comprar"   : lo que ESTE cliente ya compró. En abarrotes es la
 *                            fila más útil que existe — la gente repite compra.
 *   - "Se están acabando"  : urgencia REAL, calculada contra el stock máximo
 *                            de cada producto. Nada de urgencia inventada.
 *   - "Nuevos en la tienda": lo recién agregado.
 *   - familias             : "Quesos", "Leches"... detectadas por el nombre.
 *
 * Ojo con el orden: primero lo personal, después lo urgente, al final lo
 * temático. Un cliente nuevo no ve "Volver a comprar" y no pasa nada: la fila
 * simplemente no se arma.
 */

const RATIO_POR_ACABARSE = 0.3; // 30% o menos de su tope
const MINIMO_PARA_FILA = 4;     // menos de esto no llena la fila y se ve pobre

export const useSeccionesTienda = ({ productos, pedidos = [] }) => useMemo(() => {
  const disponibles = (productos || []).filter((p) => p.stock > 0);
  if (disponibles.length === 0) return [];

  const secciones = [];
  const porId = new Map(disponibles.map((p) => [p.id, p]));

  /* ── Volver a comprar ── */
  // Recorremos los pedidos del más reciente al más viejo y nos quedamos con el
  // primer encuentro de cada producto, para que lo último comprado vaya primero.
  const yaComprados = [];
  const vistos = new Set();
  // Ordenamos nosotros en vez de confiar en el orden que traiga la API: si
  // algún día cambia, la fila seguiría funcionando pero mostraría primero lo
  // más viejo, que es justo lo que menos sirve.
  const recientesPrimero = [...(pedidos || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  recientesPrimero.forEach((pedido) => {
    (pedido.items || []).forEach((item) => {
      const idProducto = item.productId?._id || item.productId;
      if (!idProducto || vistos.has(idProducto)) return;
      vistos.add(idProducto);
      const producto = porId.get(idProducto);
      if (producto) yaComprados.push(producto);
    });
  });
  if (yaComprados.length >= 2) {
    secciones.push({
      clave: 'volver-a-comprar',
      titulo: 'Volver a comprar',
      subtitulo: 'Lo que ya ha llevado antes',
      productos: yaComprados.slice(0, 12),
    });
  }

  /* ── Se están acabando ── */
  const porAcabarse = disponibles
    .filter((p) => p.stockMaximo > 0 && p.stock <= p.stockMaximo * RATIO_POR_ACABARSE)
    .sort((a, b) => a.stock / a.stockMaximo - b.stock / b.stockMaximo);
  if (porAcabarse.length >= MINIMO_PARA_FILA) {
    secciones.push({
      clave: 'por-acabarse',
      titulo: 'Se están acabando',
      subtitulo: 'Quedan pocas unidades',
      productos: porAcabarse.slice(0, 12),
    });
  }

  /* ── Nuevos en la tienda ── */
  const nuevos = disponibles
    .filter((p) => p.creadoEn)
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  if (nuevos.length >= MINIMO_PARA_FILA) {
    secciones.push({
      clave: 'nuevos',
      titulo: 'Nuevos en la tienda',
      subtitulo: 'Lo último que llegó',
      productos: nuevos.slice(0, 12),
    });
  }

  /* ── Familias detectadas por el nombre ── */
  agruparPorFamilia(disponibles, MINIMO_PARA_FILA)
    .slice(0, 4) // no queremos una portada infinita
    .forEach((familia) => {
      secciones.push({
        clave: `familia-${familia.titulo.toLowerCase()}`,
        titulo: familia.titulo,
        subtitulo: `${familia.productos.length} productos`,
        productos: familia.productos.slice(0, 12),
      });
    });

  return secciones;
}, [productos, pedidos]);
