import styled from 'styled-components';
import { useTemporada } from '../../hooks/useTemporada';

/*
 * ============================================================
 * CINTA DE TEMPORADA — CintaTemporada.jsx
 * ============================================================
 * La franja con el saludo de la fecha, justo debajo del encabezado.
 *
 * Es la mitad seria de la decoración: las figuras que caen ponen el ambiente,
 * pero esto DICE algo. "Pida con tiempo, que diciembre se llena" le sirve a
 * quien compra; un copo de nieve, no.
 *
 * Va debajo de la barra y no dentro: el encabezado es pegajoso (sticky) y si
 * la cinta viviera adentro se llevaría 34px de alto en todas las pantallas,
 * todo el año, para nada. Así aparece arriba del todo, se lee, y se va con el
 * scroll como cualquier otro contenido.
 * ============================================================
 */

const Banda = styled.div`
  background: var(--marca-600);
  color: #fff;
  text-align: center;
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  position: relative;
  overflow: hidden;

  /*
   * El festón de las orillas: triangulitos como los de una guirnalda de papel.
   * Dibujado con un degradado repetido en vez de una imagen — pesa cero y se
   * pinta del color del tema porque sale de la misma variable.
   */
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 64px;
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.16) 0 6px,
      transparent 6px 12px
    );
  }
  &::before { left: 0; }
  &::after  { right: 0; }

  /* En teléfono el texto ya ocupa todo el ancho: el festón lo apretaría. */
  @media (max-width: 700px) {
    font-size: 12.5px;
    padding: 8px 12px;
    &::before, &::after { display: none; }
  }
`;

const CintaTemporada = () => {
  const { tema, activo, conDecoracion } = useTemporada();

  // Sin temporada, o con la decoración apagada, no se pinta nada. Ni un div
  // vacío: un contenedor invisible sigue empujando el contenido de abajo.
  if (!activo || !conDecoracion || !tema?.decoracion?.saludo) return null;

  return <Banda role="status">{tema.decoracion.saludo}</Banda>;
};

export default CintaTemporada;
