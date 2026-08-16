import { useMemo } from 'react';

/*
 * ============================================================
 * POR DÓNDE PASÓ — useRastroTienda.js
 * ============================================================
 * El camino que hizo la persona hasta llegar al producto que está viendo, en
 * escalones que se pueden pisar para devolverse a cualquiera de ellos.
 *
 * Antes las migas eran una frase fija: "Inicio › categoría del producto ›
 * nombre". Dos problemas. Uno, decían la categoría del producto aunque la
 * persona hubiera llegado por una búsqueda o desde "Más vendidos", así que
 * anunciaban un paso que nunca dio. Dos, ninguno de los escalones se podía
 * tocar: eran un letrero, no un camino.
 *
 * DE DÓNDE SALE EL CAMINO
 * De los filtros que están puestos, no de un historial aparte. En esta tienda
 * "estar en Frutas" ES tener la categoría filtrada: no hay una página de
 * categoría a la que se navegue, hay una lista que se acota. Guardar además
 * una pila de rutas visitadas sería inventar una segunda verdad que se
 * desincroniza con la primera a la que alguien toque un filtro.
 *
 * El orden es el de la tienda: el pasillo manda sobre la categoría, y la
 * búsqueda y la promo acotan lo que quedó. Ver useStore.
 *
 * CÓMO SE PISA UN ESCALÓN
 * Volver a un escalón es apagar todo lo que se puso DESPUÉS de él y cerrar la
 * ficha lo hace la ficha, que sabe cómo hacerlo sin descuadrar la historia del
 * navegador. Cada escalón se arma con su propia limpieza y no con un "atrás"
 * genérico: tocar "Inicio" deja la tienda como estaba al entrar, no deshace un
 * paso. Ver useDetalleProducto.
 * ============================================================
 */

export const useRastroTienda = ({
  moduloSeleccionado,
  setModuloSeleccionado,
  nombrePasillo,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  terminoBusqueda,
  setTerminoBusqueda,
  promoSeleccionada,
  setPromoSeleccionada,
}) => {
  return useMemo(() => {
    // Dejar la tienda en blanco. Es lo que hace "Inicio", y también el punto
    // de partida de cualquier otro escalón: cada uno vuelve a poner lo suyo.
    const limpiarTodo = () => {
      setModuloSeleccionado?.(null);
      setCategoriaSeleccionada?.(null);
      setTerminoBusqueda?.('');
      setPromoSeleccionada?.(null);
    };

    const escalones = [
      {
        etiqueta: 'Inicio',
        alTocar: () => { limpiarTodo(); },
      },
    ];

    /*
     * El pasillo. Va primero porque en la tienda manda sobre todo lo demás:
     * estando en Panadería, las categorías y la búsqueda son de la panadería.
     */
    if (moduloSeleccionado && nombrePasillo) {
      escalones.push({
        etiqueta: nombrePasillo,
        alTocar: () => {
          limpiarTodo();
          setModuloSeleccionado?.(moduloSeleccionado);
        },
      });
    }

    if (categoriaSeleccionada) {
      escalones.push({
        etiqueta: categoriaSeleccionada,
        alTocar: () => {
          // La categoría se conserva; la búsqueda y la promo, que son más
          // finas que ella, se van.
          setTerminoBusqueda?.('');
          setPromoSeleccionada?.(null);
          setCategoriaSeleccionada?.(categoriaSeleccionada);
        },
      });
    }

    /*
     * La búsqueda entrecomillada. No es una página, pero para quien buscó es
     * el sitio del que viene, y sin ella el camino se saltaba el paso donde
     * de verdad encontró el producto.
     */
    if (terminoBusqueda) {
      escalones.push({
        etiqueta: `"${terminoBusqueda}"`,
        alTocar: () => { setPromoSeleccionada?.(null); },
      });
    }

    if (promoSeleccionada) {
      escalones.push({
        etiqueta: promoSeleccionada.title || promoSeleccionada.promoDescription || 'Promoción',
        // Ya se está viendo la promo filtrada: cerrar la ficha basta.
        alTocar: () => {},
      });
    }

    return escalones;
  }, [
    moduloSeleccionado, setModuloSeleccionado, nombrePasillo,
    categoriaSeleccionada, setCategoriaSeleccionada,
    terminoBusqueda, setTerminoBusqueda,
    promoSeleccionada, setPromoSeleccionada,
  ]);
};
