import styled from 'styled-components';

const BROWN = 'var(--marca-600)';
const BROWN_LIGHT = 'var(--marca-100)';

const Container = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 0 8px;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Pill = styled.button`
  padding: 8px 20px;
  border-radius: 30px;
  border: ${props => props.$activo ? `2px solid ${BROWN}` : '1.5px solid var(--linea)'};
  background: ${props => props.$activo ? BROWN_LIGHT : 'white'};
  color: ${props => props.$activo ? BROWN : '#666'};
  font-weight: ${props => props.$activo ? '600' : '400'};
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);

  /*
   * El color de marca se reserva para la categoría ELEGIDA. Antes cualquier
   * pastilla se pintaba de marca solo con pasar el mouse encima, así que un
   * simple roce se veía como si esa categoría ya estuviera activa. En reposo
   * usa la misma línea gris del encabezado (--linea), no la marca.
   */
  &:hover {
    border-color: ${props => props.$activo ? BROWN : 'var(--linea)'};
    background: ${props => props.$activo ? BROWN_LIGHT : '#fafafa'};
  }
`;

const CategoryPills = ({ categorias, categoriaSeleccionada, onSelectCategoria }) => {
  return (
    <Container>
      <Pill
        $activo={categoriaSeleccionada === null}
        onClick={() => onSelectCategoria(null)}
      >
        Todos
      </Pill>
      {categorias.map(categoria => (
        <Pill
          key={categoria}
          $activo={categoriaSeleccionada === categoria}
          onClick={() => onSelectCategoria(categoria)}
        >
          {categoria}
        </Pill>
      ))}
    </Container>
  );
};

export default CategoryPills;