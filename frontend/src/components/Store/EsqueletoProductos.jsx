import styled from 'styled-components';

/*
 * ============================================================
 * ESQUELETOS DE PRODUCTO — EsqueletoProductos.jsx
 * ============================================================
 * Lo que se ve mientras el catálogo viene en camino.
 *
 * POR QUÉ EXISTE, que no es por bonito: mientras el servidor contestaba, la
 * tienda mostraba "Todavía no hay productos en la tienda". O sea que un
 * arranque lento se leía como una tienda vacía — lo peor que puede decir un
 * negocio de sí mismo. "Cargando…" a secas tampoco servía: es una línea de
 * texto donde después aparece una cuadrícula, así que todo se recorría de
 * golpe al llegar los datos.
 *
 * Estos bloques ocupan EXACTAMENTE el lugar de las tarjetas de verdad, así que
 * al llegar el catálogo nada salta: solo se rellena lo que ya estaba dibujado.
 *
 * No trae grilla propia a propósito: se pinta DENTRO de la cuadrícula de quien
 * lo llama, porque la tienda y la sección usan anchos distintos y el esqueleto
 * tiene que mentir del mismo tamaño que la verdad.
 *
 * El brillo y su apagado con prefers-reduced-motion viven en la clase
 * `.esqueleto` de index.css, con el resto del vocabulario de movimiento.
 * ============================================================
 */

const Tarjeta = styled.div`
  border: 1px solid var(--linea, #ECE7E1);
  border-radius: 14px;
  overflow: hidden;
  background: var(--papel, #fff);
`;

// Mismo alto que la foto de un producto, para que la fila no cambie de altura.
const Foto = styled.div`
  aspect-ratio: 1 / 1;
  width: 100%;
`;

const Cuerpo = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Linea = styled.div`
  height: 11px;
  border-radius: 6px;
  width: ${(p) => p.$ancho || '100%'};
`;

/*
 * `cuantos` por defecto en 8: llena la primera pantalla sin pasarse. Pintar
 * treinta esqueletos para después reemplazarlos es trabajo tirado.
 */
const EsqueletoProductos = ({ cuantos = 8 }) =>
  Array.from({ length: cuantos }).map((_, i) => (
    <Tarjeta key={i} aria-hidden="true">
      <Foto className="esqueleto" />
      <Cuerpo>
        <Linea className="esqueleto" />
        <Linea className="esqueleto" $ancho="60%" />
        <Linea className="esqueleto" $ancho="35%" />
      </Cuerpo>
    </Tarjeta>
  ));

export default EsqueletoProductos;
