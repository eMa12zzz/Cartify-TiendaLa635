import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Color principal (marrón/café como en las capturas)
const BROWN = '#8B5A2B';
const BROWN_LIGHT = '#f5ede4';
const BROWN_DARK = '#5a3a1a';

/* ─── Layout ─── */
const Container = styled.div`
  min-height: 100vh;
  background: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

/* ─── Header / Top Nav ─── */
const Header = styled.div`
  background: white;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogoTop = styled.span`
  font-size: 12px;
  color: #999;
`;

const LogoMain = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.5px;
`;

const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  
  &:hover {
    background: #eee;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 30px;
  padding: 10px 16px;
  gap: 8px;
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    
    &::placeholder {
      color: #bbb;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 30px;
  font-size: 14px;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const CartBtn = styled(IconBtn)`
  background: ${BROWN};
  color: white;
  
  &:hover {
    background: ${BROWN_DARK};
  }
`;

/* ─── Category Bar ─── */
const CategoryBar = styled.div`
  background: white;
  padding: 8px 24px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid #f0f0f0;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryBtn = styled.button`
  padding: 10px 20px;
  border: none;
  background: ${props => props.$active ? BROWN_LIGHT : 'transparent'};
  color: ${props => props.$active ? BROWN : '#666'};
  font-weight: ${props => props.$active ? '600' : '400'};
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: #f5f5f5;
  }
`;

/* ─── Content ─── */
const Content = styled.div`
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

/* ─── Banners ─── */
const BannerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BannerCard = styled.div`
  background: ${props => props.$bg || '#f0f0f0'};
  border-radius: 16px;
  padding: 20px;
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
  }
`;

const BannerTag = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: white;
  background: rgba(0,0,0,0.3);
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
`;

const BannerTitle = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: white;
  line-height: 1.2;
`;

const BannerDiscount = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: white;
  
  small {
    font-size: 14px;
    font-weight: 400;
  }
`;

/* ─── Section ─── */
const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #000;
  margin: 0;
`;

const ViewLink = styled.span`
  color: ${BROWN};
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

/* ─── Products Grid ─── */
const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 16px;
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;

const WishlistIcon = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ccc;
  z-index: 2;
  
  &:hover {
    color: #ff6b6b;
  }
`;

const BestSellerBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: ${BROWN};
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
`;

const ProductEmoji = styled.div`
  font-size: 64px;
  text-align: center;
  margin-bottom: 8px;
`;

const ProductName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 2px;
`;

const ProductUnit = styled.div`
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const OldPrice = styled.span`
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
`;

const NewPrice = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #000;
`;

const AddButton = styled.button`
  background: ${BROWN};
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${BROWN_DARK};
  }
`;

/* ─── Trending Section (especial) ─── */
const TrendingSection = styled.div`
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 40px;
  position: relative;
  border: 1px solid #f0f0f0;
`;

const TrendingBadge = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${BROWN};
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  text-align: center;
  
  .small {
    font-size: 10px;
    opacity: 0.9;
  }
  .big {
    font-size: 14px;
    font-weight: 700;
  }
  .link {
    font-size: 10px;
    margin-top: 4px;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const TrendingTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin-bottom: 16px;
`;

const SubCategoryRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const SubCategoryBtn = styled.button`
  padding: 6px 16px;
  border-radius: 30px;
  border: 1.5px solid ${props => props.$active ? BROWN : '#e0e0e0'};
  background: ${props => props.$active ? BROWN_LIGHT : 'white'};
  color: ${props => props.$active ? BROWN : '#666'};
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    border-color: ${BROWN};
  }
`;

/* ─── Datos de ejemplo ─── */
const CATEGORIES = ['Pan', 'Queso', 'Yogurt', 'Lácteos', 'Snacks', 'Dulces', 'Vegetales', 'Frutas', 'Granos', 'Bebidas'];

const QUESOS_PRODUCTS = [
  { id: 1, name: 'Mystic Cheese', unit: '$2.71/lb', oldPrice: '$29.60', price: '$99.99', emoji: '🧀', bestSeller: true, stock: '12 Left' },
  { id: 2, name: 'Mystic Cheese', unit: '$2.71/lb', oldPrice: '$27.75', price: '$88.99', emoji: '🧀', bestSeller: false, stock: '12 Left' },
  { id: 3, name: 'Mystic Cheese', unit: '$1.70/lb', oldPrice: '$30.00', price: '$90.00', emoji: '🧀', bestSeller: false, stock: '12 Left' },
  { id: 4, name: 'Mystic Cheese', unit: '$1.70/lb', oldPrice: '$29.50', price: '$99.50', emoji: '🧀', bestSeller: false, stock: '12 Left' },
  { id: 5, name: 'Queso Fresco', unit: '$2.50/lb', oldPrice: '$15.00', price: '$12.99', emoji: '🧀', bestSeller: false, stock: '25 Left' },
  { id: 6, name: 'Queso Azul', unit: '$3.20/lb', oldPrice: '$25.00', price: '$19.99', emoji: '🧀', bestSeller: true, stock: '8 Left' },
];

const TRENDING_PRODUCTS = [
  { id: 7, name: 'Mystic Cheese', unit: '$2.71/lb', price: '$99.99', emoji: '🧀', stock: '12 Left' },
  { id: 8, name: 'Mystic Cheese', unit: '$2.71/lb', price: '$88.00', emoji: '🧀', stock: '12 Left' },
  { id: 9, name: 'Naranja', unit: '$1.70/lb', price: '$99.99', emoji: '🍊', stock: '50 Left' },
  { id: 10, name: 'Fresas', unit: '$1.70/lb', price: '$89.00', emoji: '🍓', stock: '30 Left' },
  { id: 11, name: 'Manzana', unit: '$2.71/lb', price: '$99.99', emoji: '🍎', stock: '45 Left' },
  { id: 12, name: 'Uvas', unit: '$2.70/lb', price: '$95.00', emoji: '🍇', stock: '20 Left' },
];

const FRUTAS_PRODUCTS = [
  { id: 13, name: 'Manzana', unit: '$2.71 por unidad', oldPrice: '$6.00', price: '$4.80', emoji: '🍎', stock: '12 Left' },
  { id: 14, name: 'Fresas', unit: '$1.70 por unidad', oldPrice: '$5.50', price: '$3.50', emoji: '🍓', stock: '12 Left' },
  { id: 15, name: 'Uvas', unit: '$2.70 por unidad', oldPrice: '$7.00', price: '$5.20', emoji: '🍇', stock: '12 Left' },
  { id: 16, name: 'Naranja', unit: '$1.70 por unidad', oldPrice: '$4.50', price: '$3.00', emoji: '🍊', stock: '12 Left' },
  { id: 17, name: 'Plátano', unit: '$0.50 por unidad', oldPrice: '$2.00', price: '$1.50', emoji: '🍌', stock: '40 Left' },
  { id: 18, name: 'Kiwi', unit: '$1.20 por unidad', oldPrice: '$3.00', price: '$2.30', emoji: '🥝', stock: '15 Left' },
];

const SUB_CATEGORIES = ['Cítricos', 'Frutos rojos', 'Fresh bakery', 'Tropicales', 'Orgánicos', 'Importados'];

const Tienda = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Queso');
  const [activeSub, setActiveSub] = useState('Cítricos');
  const [cartCount, setCartCount] = useState(0);

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <Container>
      {/* Header / Top Nav */}
      <Header>
        <LogoArea>
          <LogoTop>Tienda</LogoTop>
          <LogoMain>la 635</LogoMain>
        </LogoArea>
        
        <Location>
          📍 10115 New York
          <span style={{ fontSize: '10px' }}>▼</span>
        </Location>
        
        <SearchBox>
          <span>🔍</span>
          <input type="text" placeholder="Buscar productos..." />
        </SearchBox>
        
        <ActionButtons>
          <IconBtn>❤️</IconBtn>
          <IconBtn>🔔</IconBtn>
          <CartBtn onClick={() => alert(`Carrito: ${cartCount} items`)}>
            🛒 Carrito
            {cartCount > 0 && <span style={{ background: 'white', color: BROWN, borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', marginLeft: '4px' }}>{cartCount}</span>}
          </CartBtn>
          <IconBtn onClick={() => navigate('/dashboard')}>← Volver</IconBtn>
        </ActionButtons>
      </Header>
      
      {/* Category Bar */}
      <CategoryBar>
        {CATEGORIES.map(cat => (
          <CategoryBtn
            key={cat}
            $active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </CategoryBtn>
        ))}
      </CategoryBar>
      
      {/* Content */}
      <Content>
        
        {/* BANNERS */}
        <BannerGrid>
          <BannerCard $bg="linear-gradient(135deg, #e63946, #c1121f)">
            <BannerTag>618 Shopping Festival sale</BannerTag>
            <div>
              <BannerDiscount>30% <small>off</small></BannerDiscount>
              <BannerDiscount style={{ fontSize: '24px' }}>40% <small>off</small></BannerDiscount>
            </div>
          </BannerCard>
          
          <BannerCard $bg="linear-gradient(135deg, #2196f3, #0d47a1)">
            <BannerTag>☀️ Refreshing summer sips</BannerTag>
            <BannerTitle>Icy beverages & desserts</BannerTitle>
          </BannerCard>
          
          <BannerCard $bg="linear-gradient(135deg, #ff9800, #e65100)">
            <BannerTag>CRAZY & WEEKLY DEALS</BannerTag>
            <BannerTitle>Jun 7th → 13th</BannerTitle>
            <BannerDiscount>Save up to <small>50% off</small></BannerDiscount>
            <div style={{ marginTop: '8px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Father's Day sale</span>
            </div>
          </BannerCard>
        </BannerGrid>
        
        {/* QUESOS SECTION */}
        <Section>
          <SectionHeader>
            <SectionTitle>Quesos</SectionTitle>
            <ViewLink>Ver más →</ViewLink>
          </SectionHeader>
          <ProductsGrid>
            {QUESOS_PRODUCTS.map(product => (
              <ProductCard key={product.id}>
                {product.bestSeller && <BestSellerBadge>Más vendido</BestSellerBadge>}
                <WishlistIcon>♡</WishlistIcon>
                <ProductEmoji>{product.emoji}</ProductEmoji>
                <ProductName>{product.name}</ProductName>
                <ProductUnit>{product.unit}</ProductUnit>
                <PriceRow>
                  <div>
                    {product.oldPrice && <OldPrice>{product.oldPrice}</OldPrice>}
                    <NewPrice>{product.price}</NewPrice>
                    <div style={{ fontSize: '10px', color: '#999' }}>{product.stock}</div>
                  </div>
                  <AddButton onClick={addToCart}>+</AddButton>
                </PriceRow>
              </ProductCard>
            ))}
          </ProductsGrid>
        </Section>
        
        {/* FRUTAS EN TENDENCIA - SECCIÓN ESPECIAL */}
        <TrendingSection>
          <TrendingBadge>
            <div className="small">Producto fresco</div>
            <div className="big">1k+ Vendidas en un día</div>
            <div className="link">Ver más →</div>
          </TrendingBadge>
          
          <TrendingTitle>Frutas en tendencia</TrendingTitle>
          
          <SubCategoryRow>
            {SUB_CATEGORIES.map((sub, idx) => (
              <SubCategoryBtn
                key={idx}
                $active={activeSub === sub}
                onClick={() => setActiveSub(sub)}
              >
                {sub}
              </SubCategoryBtn>
            ))}
          </SubCategoryRow>
          
          <ProductsGrid>
            {TRENDING_PRODUCTS.slice(0, 4).map(product => (
              <ProductCard key={product.id}>
                <WishlistIcon>♡</WishlistIcon>
                <ProductEmoji>{product.emoji}</ProductEmoji>
                <ProductName>{product.name}</ProductName>
                <ProductUnit>{product.unit}</ProductUnit>
                <PriceRow>
                  <div>
                    <NewPrice>{product.price}</NewPrice>
                    <div style={{ fontSize: '10px', color: '#999' }}>{product.stock}</div>
                  </div>
                  <AddButton onClick={addToCart}>+</AddButton>
                </PriceRow>
              </ProductCard>
            ))}
          </ProductsGrid>
        </TrendingSection>
        
        {/* QUESOS SECTION 2 */}
        <Section>
          <SectionHeader>
            <SectionTitle>Quesos</SectionTitle>
            <ViewLink>Ver más →</ViewLink>
          </SectionHeader>
          <ProductsGrid>
            {QUESOS_PRODUCTS.slice(0, 4).map(product => (
              <ProductCard key={`q2-${product.id}`}>
                {product.bestSeller && <BestSellerBadge>Más vendido</BestSellerBadge>}
                <WishlistIcon>♡</WishlistIcon>
                <ProductEmoji>{product.emoji}</ProductEmoji>
                <ProductName>{product.name}</ProductName>
                <ProductUnit>{product.unit}</ProductUnit>
                <PriceRow>
                  <div>
                    {product.oldPrice && <OldPrice>{product.oldPrice}</OldPrice>}
                    <NewPrice>{product.price}</NewPrice>
                    <div style={{ fontSize: '10px', color: '#999' }}>{product.stock}</div>
                  </div>
                  <AddButton onClick={addToCart}>+</AddButton>
                </PriceRow>
              </ProductCard>
            ))}
          </ProductsGrid>
        </Section>
        
        {/* FRUTAS SECTION */}
        <Section>
          <SectionHeader>
            <SectionTitle>Frutas</SectionTitle>
            <ViewLink>Ver más →</ViewLink>
          </SectionHeader>
          <ProductsGrid>
            {FRUTAS_PRODUCTS.map(product => (
              <ProductCard key={product.id}>
                <WishlistIcon>♡</WishlistIcon>
                <ProductEmoji>{product.emoji}</ProductEmoji>
                <ProductName>{product.name}</ProductName>
                <ProductUnit>{product.unit}</ProductUnit>
                <PriceRow>
                  <div>
                    {product.oldPrice && <OldPrice>{product.oldPrice}</OldPrice>}
                    <NewPrice>{product.price}</NewPrice>
                    <div style={{ fontSize: '10px', color: '#999' }}>{product.stock}</div>
                  </div>
                  <AddButton onClick={addToCart}>+</AddButton>
                </PriceRow>
              </ProductCard>
            ))}
          </ProductsGrid>
        </Section>
        
      </Content>
      
      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #f0f0f0', background: 'white', fontSize: '12px', color: '#999' }}>
        Sobre Nosotros · Tienda la 635 · Todos los derechos reservados
      </div>
    </Container>
  );
};

export default Tienda;