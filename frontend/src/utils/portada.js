/*
 * ============================================================
 * BLOQUES DE LA PORTADA — portada.js
 * ============================================================
 * Qué se puede acomodar en la primera pantalla de la tienda.
 *
 * LA REGLA: libertad acotada.
 *
 * El dueño puede ELEGIR CUÁLES filas se muestran y EN QUÉ ORDEN. Lo que no
 * puede es inventar una fila nueva ni escoger a mano qué producto va en cada
 * una. Eso último no es una limitación por pereza: las filas se arman solas
 * con lo que hay en el inventario (ver useSeccionesTienda), y esa es la razón
 * de que sigan teniendo sentido seis meses después sin que nadie las toque.
 * Un constructor libre termina, siempre, en una portada que alguien armó una
 * vez y quedó apuntando a productos que ya no existen.
 *
 * Lo que sí se protege: la portada no puede quedar vacía. Ver useAjustesTienda.
 * ============================================================
 */

/*
 * El catálogo. El ORDEN de este arreglo es el orden por defecto — el que ve
 * una tienda recién instalada que nunca entró a personalizar nada.
 *
 * `fija` marca las filas que el sistema arma siempre igual. Las que no lo son
 * dependen de datos: "Volver a comprar" necesita que ese cliente haya
 * comprado antes, y los estantes automáticos necesitan que el clasificador
 * reconozca familias. Apagar una fila que hoy no se pinta igual sirve: el día
 * que haya datos, aparece o no según lo que se haya decidido aquí.
 */
export const BLOQUES_PORTADA = [
  {
    clave: 'promos',
    nombre: 'Promociones',
    descripcion: 'El carrusel de ofertas, arriba del todo.',
    fija: true,
  },
  {
    clave: 'mas-vendidos',
    nombre: 'Más vendidos',
    descripcion: 'Lo que más sale, en una fila que se desliza de lado.',
    fija: true,
  },
  {
    clave: 'volver-a-comprar',
    nombre: 'Volver a comprar',
    descripcion: 'Lo que ese cliente ya llevó antes. En abarrotes es la fila más útil que existe.',
    fija: false,
  },
  {
    clave: 'por-acabarse',
    nombre: 'Se están acabando',
    descripcion: 'Lo que queda poco, medido contra el tope de cada producto. Urgencia real, no inventada.',
    fija: false,
  },
  {
    clave: 'nuevos',
    nombre: 'Nuevos en la tienda',
    descripcion: 'Lo último que se agregó al inventario.',
    fija: false,
  },
  {
    clave: 'familias',
    nombre: 'Estantes automáticos',
    descripcion: 'Quesos, bebidas energizantes, limpieza… los reconoce el clasificador. Van todos juntos o ninguno.',
    fija: false,
  },
];

export const CLAVES_DE_PORTADA = BLOQUES_PORTADA.map((b) => b.clave);

export const bloquePorClave = (clave) => BLOQUES_PORTADA.find((b) => b.clave === clave);

/*
 * Las filas que arma useSeccionesTienda tienen claves propias: las tres
 * conocidas y luego "familia-quesos", "familia-bebidas"… Todas esas caen bajo
 * el mismo interruptor, porque cuáles aparecen depende del inventario y no
 * tendría sentido pedirle a alguien que ordene una lista que cambia sola.
 */
export const bloqueDeSeccion = (claveDeSeccion = '') =>
  claveDeSeccion.startsWith('familia-') ? 'familias' : claveDeSeccion;

/*
 * Junta lo guardado con el catálogo y devuelve la lista lista para pintar o
 * para editar: en orden, sin claves que ya no existan y sin dejar fuera las
 * que se agregaron al catálogo después de la última vez que se guardó.
 *
 * Lo segundo importa más de lo que parece: el día que se invente un bloque
 * nuevo, las tiendas que ya habían personalizado su portada NO tienen que
 * volver a entrar a activarlo. Aparece al final, encendido, como cualquier
 * novedad del sistema.
 */
export const resolverPortada = (guardadas = []) => {
  const porClave = new Map(
    (guardadas || [])
      .filter((s) => s && CLAVES_DE_PORTADA.includes(s.clave))
      .map((s) => [s.clave, s])
  );

  return BLOQUES_PORTADA
    .map((bloque, indiceEnCatalogo) => {
      const guardada = porClave.get(bloque.clave);
      return {
        ...bloque,
        visible: guardada ? guardada.visible !== false : true,
        // Sin nada guardado manda el orden del catálogo. El +100 empuja los
        // bloques nuevos al final en vez de mezclarlos con los ya acomodados.
        orden: guardada && Number.isFinite(Number(guardada.orden))
          ? Number(guardada.orden)
          : indiceEnCatalogo + (porClave.size ? 100 : 0),
      };
    })
    .sort((a, b) => a.orden - b.orden)
    // El orden se normaliza a 0,1,2… para que no se vayan acumulando huecos
    // cada vez que alguien mueve una fila.
    .map((bloque, i) => ({ ...bloque, orden: i }));
};
