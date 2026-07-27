import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, ShoppingBag, Star, ChevronDown, ChevronRight, ChevronLeft, Package, MessageCircle, Leaf } from 'lucide-react';

const BROWN = '#B46C30';
const BROWN_LIGHT = '#F3E7D8';
const BROWN_DARK = '#8A5222';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 0;
  animation: ${fadeIn} 0.2s var(--ease-out);
`;

/* Full-page modal like the design */
const Page = styled.div`
  background: white;
  width: 100%;
  min-height: 100vh;
  animation: ${slideUp} 0.22s var(--ease-out);
`;

/* ── Top bar ── */
const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #888;

  span.active { color: ${BROWN}; font-weight: 600; }
  span.sep { color: #ccc; }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #555;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { color: ${BROWN}; }
`;

const HelpBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid #e0e0e0;
  border-radius: 30px;
  background: white;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  font-weight: 500;
  &:hover { border-color: ${BROWN}; color: ${BROWN}; }
`;

/* ── Main layout ── */
const Main = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 28px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 48px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

/* ── Left: image + reviews ── */
const LeftCol = styled.div``;

const ImageArea = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Thumbnails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
`;

const Thumb = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.$active ? BROWN : '#e8e8e8'};
  transition: border-color 0.2s;
  background: #f7f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;

  /* Igual que la foto grande: la miniatura muestra el producto entero */
  padding: 6px;
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
  &:hover { border-color: ${BROWN}; }
`;

const MainImageWrapper = styled.div`
  flex: 1;
  background: #f7f3ef;
  border-radius: 20px;
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const MainImage = styled.img`
  max-width: 85%;
  max-height: 340px;
  object-fit: contain;
  filter: drop-shadow(0 12px 28px rgba(0,0,0,0.14));
`;

const ImageFallback = styled.div`
  font-size: 120px;
  user-select: none;
`;

const BestBadge = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: ${BROWN};
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

/* ── Reviews block ── */
const ReviewsBlock = styled.div`
  margin-top: 32px;
`;

const ReviewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ReviewsTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const SeeAllLink = styled.button`
  background: none;
  border: none;
  color: ${BROWN};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  &:hover { text-decoration: underline; }
`;

const RatingSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const BigRating = styled.div`
  text-align: center;
`;

const BigNumber = styled.div`
  font-size: 40px;
  font-weight: 800;
  color: #111;
  line-height: 1;
`;

const BigLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 2px;
`;

const RatingBars = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RatingBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
`;

const BarBg = styled.div`
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  background: #f59e0b;
  border-radius: 3px;
  width: ${props => props.$pct}%;
`;

const BarCount = styled.span`
  min-width: 32px;
  text-align: right;
  color: #aaa;
`;

const ReviewCard = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
`;

const ReviewerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  background: ${BROWN_LIGHT};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: ${BROWN};
  flex-shrink: 0;
`;

const ReviewerName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
`;

const ReviewDate = styled.div`
  font-size: 11px;
  color: #aaa;
`;

const ReviewStars = styled.div`
  display: flex;
  gap: 2px;
  color: #f59e0b;
  margin-bottom: 6px;
`;

const ReviewText = styled.p`
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin: 0;
`;

/* ── Accordion ── */
const AccordionItem = styled.div`
  border-top: 1px solid #f0f0f0;
`;

const AccordionBtn = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #111;
  cursor: pointer;
  text-align: left;
`;

const AccordionBody = styled.div`
  padding-bottom: 16px;
  font-size: 13px;
  color: #666;
  line-height: 1.65;
`;

/* ── Recommendations ── */
const RecsSection = styled.div`
  margin-top: 40px;
`;

const RecsTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0 0 16px;
`;

const RecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
`;

const RecCard = styled.div`
  background: #fafafa;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const RecImgBox = styled.div`
  height: 110px;
  background: #f7f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  padding: 10px;

  img { max-width: 100%; max-height: 100%; object-fit: contain; }
`;

const RecInfo = styled.div`
  padding: 10px 12px 12px;
`;

const RecName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #111;
  margin-bottom: 2px;
`;

const RecUnit = styled.div`
  font-size: 11px;
  color: #aaa;
  margin-bottom: 4px;
`;

const RecPrice = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
`;

const RecOldPrice = styled.span`
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
  margin-left: 4px;
`;

const RecStock = styled.div`
  font-size: 10px;
  color: ${BROWN};
  margin-top: 2px;
`;

/* ── Right: product info sticky panel ── */
const RightCol = styled.div`
  position: sticky;
  top: 80px;
  align-self: start;
`;

const BrandTag = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${BROWN};
  letter-spacing: 1px;
  margin-bottom: 6px;
`;

const ProductName = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #111;
  margin: 0 0 8px;
  line-height: 1.25;
`;

const PriceLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
`;

const UnitLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 14px;
`;

const OldPrice = styled.span`
  font-size: 16px;
  color: #bbb;
  text-decoration: line-through;
`;

const NewPrice = styled.span`
  font-size: 34px;
  font-weight: 800;
  color: #111;
`;

const StockBadge = styled.span`
  font-size: 12px;
  color: ${props => props.$low ? '#ef4444' : '#22c55e'};
  background: ${props => props.$low ? '#fee2e2' : '#dcfce7'};
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
`;

const AddBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: ${BROWN};
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s;
  margin-bottom: 10px;

  &:hover { background: ${BROWN_DARK}; }
  &:disabled { background: #d1d5db; cursor: not-allowed; }
`;

const AboutSection = styled.div`
  margin-top: 20px;
`;

const AboutTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const FeatureRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #444;
`;

const FeatureIcon = styled.span`
  width: 28px;
  height: 28px;
  background: ${BROWN_LIGHT};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
`;

/* ── Helper: fake reviews ── */
const fakeReviews = [
  { id: 1, name: 'Carlos M.', rating: 5, date: 'hace 2 días', text: '¡Increíble producto! Esta reseña se recibió como parte de una promoción. Los precios son excelentes y la calidad es justo lo que esperaba. Lo recomiendo totalmente a cualquier usuario.' },
  { id: 2, name: 'Ana R.', rating: 4, date: 'hace 1 semana', text: 'Muy buen producto, llegó en perfecto estado. El empaque es cuidadoso y el sabor es auténtico. Definitivamente volvería a comprar.' },
];

const fakeRatingBars = [
  { stars: 5, pct: 62, count: '4.2k' },
  { stars: 4, pct: 20, count: '1.3k' },
  { stars: 3, pct: 10, count: '4.2k' },
  { stars: 2, pct: 5,  count: '4.2k' },
  { stars: 1, pct: 3,  count: '4.2k' },
];

/* ── Component ── */
const ProductDetailModal = ({ producto, onClose, onAgregarAlCarrito, todosLosProductos = [] }) => {
  const [imgError, setImgError] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);

  const bajoStock = producto.stock < 10;
  const rating = 4.3;
  const reviewCount = 5961;

  // fake thumbnails using same emoji/image
  const thumbs = [0, 1, 2];

  const recomendados = todosLosProductos
    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
    .slice(0, 5);

  const handleAgregar = () => {
    onAgregarAlCarrito(producto, 1);
    onClose();
  };

  const toggleAccordion = (key) => setOpenAccordion(prev => prev === key ? null : key);

  return (
    <Overlay onClick={onClose}>
      <Page onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <TopBar>
          <BackBtn onClick={onClose}>
            <ChevronLeft size={18} /> Volver
          </BackBtn>
          <Breadcrumb>
            <span>Inicio</span>
            <span className="sep">›</span>
            <span>{producto.categoria}</span>
            <span className="sep">›</span>
            <span className="active">{producto.nombre}</span>
          </Breadcrumb>
          <HelpBtn>
            <MessageCircle size={15} strokeWidth={2} /> Ayuda
          </HelpBtn>
        </TopBar>

        <Main>
          {/* ── Left column ── */}
          <LeftCol>
            <ImageArea>
              {/* Thumbnails */}
              <Thumbnails>
                {thumbs.map(i => (
                  <Thumb key={i} $active={activeThumb === i} onClick={() => setActiveThumb(i)}>
                    {producto.imagen && !imgError
                      ? <img src={producto.imagen} alt="" onError={() => setImgError(true)} />
                      : <Package size={22} strokeWidth={1.4} />
                    }
                  </Thumb>
                ))}
              </Thumbnails>

              {/* Main image */}
              <MainImageWrapper>
                {producto.esMasVendido && <BestBadge>Los más vendidos</BestBadge>}
                {producto.imagen && !imgError
                  ? <MainImage src={producto.imagen} alt={producto.nombre} onError={() => setImgError(true)} />
                  : <ImageFallback><Package size={72} strokeWidth={1.2} /></ImageFallback>
                }
              </MainImageWrapper>
            </ImageArea>

            {/* Reviews summary */}
            <ReviewsBlock>
              <ReviewsHeader>
                <ReviewsTitle>Reseñas de clientes</ReviewsTitle>
                <SeeAllLink>Recientes <ChevronRight size={13} /></SeeAllLink>
              </ReviewsHeader>

              <RatingSummary>
                <BigRating>
                  <BigNumber>{rating}</BigNumber>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '4px 0 2px' }}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke={i <= Math.round(rating) ? '#f59e0b' : '#ddd'} />
                    ))}
                  </div>
                  <BigLabel>({reviewCount.toLocaleString()})</BigLabel>
                </BigRating>
                <RatingBars>
                  {fakeRatingBars.map(row => (
                    <RatingBarRow key={row.stars}>
                      <span style={{ minWidth: 8 }}>{row.stars}</span>
                      <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                      <BarBg><BarFill $pct={row.pct} /></BarBg>
                      <BarCount>+ {row.count}</BarCount>
                    </RatingBarRow>
                  ))}
                </RatingBars>
              </RatingSummary>

              <ReviewsHeader style={{ marginBottom: 8 }}>
                <ReviewsTitle>Reseñas</ReviewsTitle>
              </ReviewsHeader>

              {fakeReviews.map(r => (
                <ReviewCard key={r.id}>
                  <ReviewerRow>
                    <Avatar>{r.name[0]}</Avatar>
                    <div>
                      <ReviewerName>{r.name}</ReviewerName>
                      <ReviewDate>{r.date}</ReviewDate>
                    </div>
                  </ReviewerRow>
                  <ReviewStars>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} fill={i <= r.rating ? '#f59e0b' : 'none'} stroke={i <= r.rating ? '#f59e0b' : '#ddd'} />
                    ))}
                  </ReviewStars>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 4px' }}>¡Increíble producto!</p>
                  <ReviewText>{r.text}</ReviewText>
                </ReviewCard>
              ))}
            </ReviewsBlock>

            {/* Accordion: Detalles, Conservación, Ingredientes */}
            <div style={{ marginTop: 24 }}>
              {[
                { key: 'detalles', label: 'Detalles', body: `Categoría: ${producto.categoria} · Marca: ${producto.marca || '—'} · Stock: ${producto.stock} unidades · Vence: ${producto.fechaExpiracion || '—'}` },
                { key: 'conservacion', label: 'Conservación y almacenamiento', body: 'Conservar en lugar fresco y seco, alejado de la humedad y fuentes de calor. Una vez abierto, consumir preferiblemente en el plazo indicado en el envase.' },
                { key: 'ingredientes', label: 'Ingredientes o Valor Nutricional', body: 'Consulte la etiqueta del producto para información detallada sobre ingredientes y valores nutricionales.' },
              ].map(item => (
                <AccordionItem key={item.key}>
                  <AccordionBtn onClick={() => toggleAccordion(item.key)}>
                    {item.label}
                    <ChevronDown size={16} style={{ transform: openAccordion === item.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </AccordionBtn>
                  {openAccordion === item.key && <AccordionBody>{item.body}</AccordionBody>}
                </AccordionItem>
              ))}
            </div>

            {/* Recommendations */}
            {recomendados.length > 0 && (
              <RecsSection>
                <RecsTitle>Recomendaciones</RecsTitle>
                <RecsGrid>
                  {recomendados.map(p => (
                    <RecCard key={p.id} onClick={() => { /* open detail */ }}>
                      <RecImgBox>
                        {p.imagen ? <img src={p.imagen} alt={p.nombre} /> : <Package size={30} strokeWidth={1.4} />}
                      </RecImgBox>
                      <RecInfo>
                        <RecName>{p.nombre}</RecName>
                        <RecUnit>{p.marca || 'por unidad'}</RecUnit>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <RecPrice>${Number(p.precio).toFixed(2)}</RecPrice>
                          {p.precioAnterior && <RecOldPrice>${Number(p.precioAnterior).toFixed(2)}</RecOldPrice>}
                        </div>
                        <RecStock>{p.stock} Left</RecStock>
                      </RecInfo>
                    </RecCard>
                  ))}
                </RecsGrid>
              </RecsSection>
            )}
          </LeftCol>

          {/* ── Right column: sticky info ── */}
          <RightCol>
            <BrandTag>{producto.marca}</BrandTag>
            <ProductName>{producto.nombre}</ProductName>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke={i <= Math.round(rating) ? '#f59e0b' : '#ddd'} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#888' }}>{rating} ({reviewCount.toLocaleString()} reseñas)</span>
            </div>

            <PriceLine>
              {producto.precioAnterior && <OldPrice>${Number(producto.precioAnterior).toFixed(2)}</OldPrice>}
              <NewPrice>${Number(producto.precio).toFixed(2)}</NewPrice>
              <StockBadge $low={bajoStock}>
                {bajoStock ? `⚠️ ${producto.stock} restantes` : '✓ En stock'}
              </StockBadge>
            </PriceLine>
            <UnitLabel>$2.71/lb · {producto.stock} Left</UnitLabel>

            <AddBtn onClick={handleAgregar} disabled={producto.stock === 0}>
              <ShoppingBag size={18} />
              Añadir al carrito
            </AddBtn>

            {/* About section */}
            <AboutSection>
              <AboutTitle>Sobre el producto</AboutTitle>
              {producto.esMasVendido && (
                <FeatureRow>
                  <FeatureIcon>⭐</FeatureIcon>
                  Los más vendidos
                  <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: BROWN, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Ver más →</button>
                </FeatureRow>
              )}
              <FeatureRow>
                <FeatureIcon><Leaf size={17} strokeWidth={1.8} /></FeatureIcon>
                100% Natural
              </FeatureRow>
              {producto.descripcion && (
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginTop: 12 }}>
                  {producto.descripcion}
                </p>
              )}
            </AboutSection>
          </RightCol>
        </Main>
      </Page>
    </Overlay>
  );
};

export default ProductDetailModal;