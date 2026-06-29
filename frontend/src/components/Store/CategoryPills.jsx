import styled from 'styled-components';

const BROWN = '#8B5A2B';
const BROWN_LIGHT = '#f5ede4';

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
  border: ${props => props.$activo ? `2px solid ${BROWN}` : '1.5px solid #e0e0e0'};
  background: ${props => props.$activo ? BROWN_LIGHT : 'white'};
  color: ${props => props.$activo ? BROWN : '#666'};
  font-weight: ${props => props.$activo ? '600' : '400'};
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: ${BROWN};
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