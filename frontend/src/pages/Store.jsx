import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useStore } from '../hooks/useStore';
import ProductCard from '../components/Store/ProductCard';
import ProductDetailModal from '../components/Store/ProductDetailModal';
import ShoppingCart from '../components/Store/ShoppingCart';
import { Toaster } from 'react-hot-toast';

const BROWN = '#8B5A2B';
const BROWN_DARK = '#5a3a1a';
const BROWN_LIGHT = '#f5ede4';

/* ─── Layout ─── */
const Container = styled.div`
  min-height: 100vh;
  background: #f6f6f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

/* ─── Header ─── */
const Header = styled.header`
  background: white;
  padding: 0 28px;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 200;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex-shrink: 0;
`;

const LogoTop = styled.span`
  font-size: 11px;
  color: #aaa;
  line-height: 1;
`;

const LogoMain = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 420px;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40px;
  padding: 0 16px;
  gap: 8px;
  height: 42px;
  transition: box-shadow 0.2s;

  &:focus-within {
    box-shadow: 0 0 0 2px ${BROWN}40;
    background: white;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #111;
    &::placeholder { color: #bbb; }
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 30px;
  font-size: 14px;
  color: #444;
  transition: background 0.2s;
  &:hover { background: #f5f5f5; }
`;

const CartBtn = styled.button`
  background: ${BROWN};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  &:hover { background: ${BROWN_DARK}; }
`;

const CartBadge = styled.span`
  background: white;
  color: ${BROWN};
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  padding: 0 4px;
`;

/* ─── Category Bar ─── */
const CategoryBar = styled.nav`
  background: white;
  padding: 0 28px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid #ebebeb;
  height: 52px;
  align-items: center;
  &::-webkit-scrollbar { display: none; }
`;

const CatBtn = styled.button`
  padding: 7px 18px;
  border: none;
  background: ${props => props.$active ? BROWN_LIGHT : 'transparent'};
  color: ${props => props.$active ? BROWN : '#666'};
  font-weight: ${props => props.$active ? '600' : '400'};
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { background: ${BROWN_LIGHT}; color: ${BROWN}; }
`;

/* ─── Hero Banner ─── */
const BannerSection = styled.div`
  padding: 20px 28px 0;
  max-width: 1400px;
  margin: 0 auto;
`;

const BannersGrid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 14px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const BannerCard = styled.div`
  border-radius: 16px;
  overflow: hidden;
  height: 180px;
  position: relative;
  cursor: pointer;
  background: ${props => props.$bg || '#f0e6d3'};
  display: flex;
  align-items: center;
  padding: 24px;
  transition: transform 0.2s;
  &:hover { transform: scale(1.01); }
`;

const BannerContent = styled.div`z-index: 1; flex: 1;`;

const BannerTag = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${props => props.$color || BROWN};
  margin-bottom: 6px;
`;

const BannerTitle = styled.h3`
  font-size: 22px;
  font-weight: 800;
  color: ${props => props.$color || '#111'};
  margin: 0 0 6px;
  line-height: 1.2;
`;

const BannerSub = styled.p`
  font-size: 13px;
  color: ${props => props.$color || '#666'};
  margin: 0 0 12px;
`;

const BannerBtn = styled.button`
  background: ${props => props.$bg || BROWN};
  color: ${props => props.$color || 'white'};
  border: none;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BannerEmoji = styled.div`
  font-size: 72px;
  opacity: 0.85;
  margin-left: 8px;
  flex-shrink: 0;
`;

/* ─── Content ─── */
const Content = styled.div`
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const SectionCount = styled.span`
  font-size: 13px;
  color: #aaa;
`;

/* ─── Filter bar with dropdown ─── */
const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
  position: relative;
`;

const FilterBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1.5px solid ${props => props.$open ? BROWN : '#e0e0e0'};
  background: ${props => props.$open ? BROWN_LIGHT : 'white'};
  color: ${props => props.$open ? BROWN : '#444'};
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${BROWN}; color: ${BROWN}; background: ${BROWN_LIGHT}; }
`;

/* Dropdown panel – matches design exactly */
const FilterDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${BROWN};
  border-radius: 14px;
  padding: 16px 20px;
  z-index: 100;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
`;

const FilterDropTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const FilterOption = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: white;
  font-weight: ${props => props.$active ? '700' : '400'};
  text-align: left;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

const FilterToggle = styled.div`
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: ${props => props.$active ? 'white' : 'rgba(255,255,255,0.3)'};
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$active ? '17px' : '3px'};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$active ? BROWN : 'white'};
    transition: left 0.2s;
  }
`;

/* ─── Trending Section ─── */
const TrendingSection = styled.div`
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 28px;
`;

const TrendingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TrendingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const TrendingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-top: 16px;
`;

/* ─── Products Grid ─── */
const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 16px;
  .icon { font-size: 48px; margin-bottom: 12px; }
`;

/* ─── Component ─── */
const Store = () => {
  const navigate = useNavigate();
  const {
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    terminoBusqueda,
    setTerminoBusqueda,
    productosFiltrados,
    productosDestacados,
    productos, // all products for recommendations
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    carrito,
    totalCarrito,
    cantidadItems,
    limpiarCarrito,
    filtroPrecio,
    setFiltroPrecio,
  } = useStore();

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCerrarSesion = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAbrirDetalle = (producto) => setProductoSeleccionado(producto);
  const handleCerrarDetalle = () => setProductoSeleccionado(null);

  const precioFiltros = [
    { key: 'todos', label: 'Todos' },
    { key: '0-4', label: '$4 - 12$' },
    { key: '4-12', label: '$4 - 12$' },
    { key: '12+', label: 'Arriba de $4' },
  ];

  // Display labels matching design
  const filterLabels = {
    'todos': 'Todos',
    '0-4': '$4 - 12$',
    '4-12': '$4 - 12$',
    '12+': 'Arriba de $4',
  };

  const showTrending = !categoriaSeleccionada && !terminoBusqueda;

  return (
    <Container>
      <Toaster position="bottom-right" toastOptions={{ duration: 2500 }} />

      {/* ── Header ── */}
      <Header>
        <LogoArea onClick={() => navigate('/tienda-dashboard')}>
          <LogoTop>Tienda</LogoTop>
          <LogoMain>la 635</LogoMain>
        </LogoArea>

        <SearchBox>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
          {terminoBusqueda && (
            <button
              onClick={() => setTerminoBusqueda('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}
            >✕</button>
          )}
        </SearchBox>

        <HeaderRight>
          <CartBtn onClick={() => setMostrarCarrito(true)}>
            🛒 Carrito
            {cantidadItems > 0 && <CartBadge>{cantidadItems}</CartBadge>}
          </CartBtn>
          <IconBtn onClick={handleCerrarSesion} title="Cerrar sesión">🚪</IconBtn>
        </HeaderRight>
      </Header>

      {/* ── Category Bar ── */}
      <CategoryBar>
        <CatBtn $active={!categoriaSeleccionada} onClick={() => setCategoriaSeleccionada(null)}>
          Todos
        </CatBtn>
        {categorias.map(cat => (
          <CatBtn
            key={cat}
            $active={categoriaSeleccionada === cat}
            onClick={() => setCategoriaSeleccionada(cat)}
          >
            {cat}
          </CatBtn>
        ))}
      </CategoryBar>

      {/* ── Hero Banners ── */}
      {showTrending && (
        <BannerSection>
          <BannersGrid>
            <BannerCard $bg="linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)">
              <BannerContent>
                <BannerTag $color={BROWN}>🔥 Oferta especial</BannerTag>
                <BannerTitle $color="#111">Frutas frescas<br/>del día</BannerTitle>
                <BannerSub $color="#666">Directo del mercado a tu mesa</BannerSub>
                <BannerBtn $bg={BROWN} onClick={() => setCategoriaSeleccionada('Frutas')}>
                  Ver frutas →
                </BannerBtn>
              </BannerContent>
              <BannerEmoji>🍊</BannerEmoji>
            </BannerCard>

            <BannerCard $bg="linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)">
              <BannerContent>
                <BannerTag $color="#2e7d32">🥛 Lácteos</BannerTag>
                <BannerTitle $color="#1b5e20" style={{ fontSize: 18 }}>Lácteos<br/>frescos</BannerTitle>
                <BannerBtn $bg="#2e7d32" onClick={() => setCategoriaSeleccionada('Lácteos')}>
                  Ver más →
                </BannerBtn>
              </BannerContent>
              <BannerEmoji style={{ fontSize: 52 }}>🧀</BannerEmoji>
            </BannerCard>

            <BannerCard $bg="linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)">
              <BannerContent>
                <BannerTag $color="#c62828">🍪 Snacks</BannerTag>
                <BannerTitle $color="#880e4f" style={{ fontSize: 18 }}>Snacks<br/>favoritos</BannerTitle>
                <BannerBtn $bg="#c62828" onClick={() => setCategoriaSeleccionada('Snacks')}>
                  Ver más →
                </BannerBtn>
              </BannerContent>
              <BannerEmoji style={{ fontSize: 52 }}>🍪</BannerEmoji>
            </BannerCard>
          </BannersGrid>
        </BannerSection>
      )}

      <Content>
        {/* ── Trending ── */}
        {showTrending && productosDestacados.length > 0 && (
          <TrendingSection>
            <TrendingHeader>
              <TrendingBadge>
                <LiveDot />
                <SectionTitle>Más vendidos</SectionTitle>
              </TrendingBadge>
              <SectionCount>{productosDestacados.length} productos</SectionCount>
            </TrendingHeader>
            <TrendingGrid>
              {productosDestacados.map(producto => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onVerDetalle={handleAbrirDetalle}
                  onAgregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </TrendingGrid>
          </TrendingSection>
        )}

        {/* ── All / Filtered Products ── */}
        <div>
          <SectionHeader>
            <SectionTitle>
              {categoriaSeleccionada || terminoBusqueda
                ? (categoriaSeleccionada || `"${terminoBusqueda}"`)
                : 'Todos los productos'}
            </SectionTitle>
            <SectionCount>{productosFiltrados.length} productos</SectionCount>
          </SectionHeader>

          {/* ── Filter button + dropdown ── */}
          <FilterBar ref={filterRef}>
            <FilterBtn $open={filterOpen} onClick={() => setFilterOpen(o => !o)}>
              ⚙ Filtros
            </FilterBtn>

            {filterOpen && (
              <FilterDropdown>
                <FilterDropTitle>Price</FilterDropTitle>
                {precioFiltros.map(f => (
                  <FilterOption
                    key={f.key}
                    $active={filtroPrecio === f.key}
                    onClick={() => { setFiltroPrecio(f.key); setFilterOpen(false); }}
                  >
                    <FilterToggle $active={filtroPrecio === f.key} />
                    {f.label}
                  </FilterOption>
                ))}
              </FilterDropdown>
            )}
          </FilterBar>

          {productosFiltrados.length === 0 ? (
            <EmptyState>
              <div className="icon">🔍</div>
              No hay productos para "{terminoBusqueda || categoriaSeleccionada}"
            </EmptyState>
          ) : (
            <ProductsGrid>
              {productosFiltrados.map(producto => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onVerDetalle={handleAbrirDetalle}
                  onAgregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </ProductsGrid>
          )}
        </div>
      </Content>

      {/* ── Modals ── */}
      {productoSeleccionado && (
        <ProductDetailModal
          producto={productoSeleccionado}
          onClose={handleCerrarDetalle}
          onAgregarAlCarrito={agregarAlCarrito}
          todosLosProductos={productos || productosFiltrados}
        />
      )}

      {mostrarCarrito && (
        <ShoppingCart
          items={carrito}
          total={totalCarrito}
          onCerrar={() => setMostrarCarrito(false)}
          onActualizarCantidad={actualizarCantidad}
          onEliminarItem={eliminarDelCarrito}
          onLimpiarCarrito={limpiarCarrito}
          onCheckout={() => {
            limpiarCarrito();
            setMostrarCarrito(false);
          }}
        />
      )}
    </Container>
  );
};

export default Store;