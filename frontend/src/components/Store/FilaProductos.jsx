import { ChevronLeft, ChevronRight } from 'lucide-react';
import styled from 'styled-components';
import ProductCard from './ProductCard';
import { useFilaDeslizable } from '../../hooks/useFilaDeslizable';

/*
 * FilaProductos — una sección de la portada: título, flechas y la fila que se
 * corre de lado.
 *
 * Es un componente y no un bucle dentro de Store porque cada fila necesita su
 * propio useFilaDeslizable, y los hooks no se pueden llamar dentro de un map.
 */
const Seccion = styled.section`
  background: var(--papel);
  border-radius: var(--radio-panel);
  padding: 20px 22px 22px;
  margin-bottom: 18px;
  box-shadow: var(--sombra-tarjeta);
`;

const Encabezado = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
`;

const Titulo = styled.h2`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--tinta);
  margin: 0;
`;

const Subtitulo = styled.p`
  font-size: 13px;
  color: var(--tinta-tenue);
  margin: 2px 0 0;
`;

const Flechas = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const Circulo = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--linea);
  background: var(--papel);
  color: var(--tinta);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out);
  &:hover:not(:disabled) { border-color: var(--marca-600); color: var(--marca-600); background: var(--marca-50); }
  &:disabled { opacity: 0.35; cursor: default; }
`;

/* scroll-snap para que nunca quede una tarjeta cortada por la mitad. */
const Fila = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding-bottom: 4px;
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  > * {
    flex: 0 0 clamp(160px, 21%, 214px);
    scroll-snap-align: start;
  }
`;

const FilaProductos = ({ titulo, subtitulo, productos, onVerDetalle, onAgregarAlCarrito }) => {
  const { fila, puedeIzq, puedeDer, izquierda, derecha } = useFilaDeslizable();

  if (!productos?.length) return null;

  return (
    <Seccion>
      <Encabezado>
        <div>
          <Titulo>{titulo}</Titulo>
          {subtitulo && <Subtitulo>{subtitulo}</Subtitulo>}
        </div>
        {/* Con pocos productos no hay para dónde correr: no ponemos flechas. */}
        {(puedeIzq || puedeDer) && (
          <Flechas>
            <Circulo onClick={izquierda} disabled={!puedeIzq} aria-label={`Ver anteriores de ${titulo}`}>
              <ChevronLeft size={19} strokeWidth={2.2} />
            </Circulo>
            <Circulo onClick={derecha} disabled={!puedeDer} aria-label={`Ver siguientes de ${titulo}`}>
              <ChevronRight size={19} strokeWidth={2.2} />
            </Circulo>
          </Flechas>
        )}
      </Encabezado>

      <Fila ref={fila}>
        {productos.map((producto) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            onVerDetalle={onVerDetalle}
            onAgregarAlCarrito={onAgregarAlCarrito}
          />
        ))}
      </Fila>
    </Seccion>
  );
};

export default FilaProductos;
