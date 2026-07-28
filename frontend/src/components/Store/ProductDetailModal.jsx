import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, ShoppingBag, Star, ChevronRight, ChevronLeft, Package, MessageCircle } from 'lucide-react';
import { useReviews } from '../../hooks/useReviews';
import ProductCard from './ProductCard';

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
  /* Mismo respiro que la grilla de la tienda, para que se lean igual */
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
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

/*
 * Fecha en palabras: "hace 2 días" se lee mejor que un 03/08/2026 en una
 * reseña, que es donde importa si la opinión es reciente.
 */
const haceCuanto = (iso) => {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(dias)) return '';
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} semana${dias < 14 ? '' : 's'}`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} mes${dias < 60 ? '' : 'es'}`;
  return 'hace más de un año';
};

/* ── Component ── */
const ProductDetailModal = ({ producto, onClose, onAgregarAlCarrito, onVerProducto, todosLosProductos = [] }) => {
  const [imgError, setImgError] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);

  /*
   * Valoraciones REALES. Antes esto era un 4.3 clavado con "5,961 reseñas" y
   * dos comentarios firmados por gente inventada, iguales en todos los
   * productos: publicidad engañosa puesta frente a quien está por comprar.
   */
  const { total: reviewCount, promedio: rating, reparto, reviews, miValoracion, puedeOpinar, guardar, guardando } = useReviews(producto.id);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');

  // Barras del desglose, calculadas sobre lo que hay de verdad.
  const barras = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reparto?.[stars] || 0,
    pct: reviewCount ? Math.round(((reparto?.[stars] || 0) / reviewCount) * 100) : 0,
  }));

  const enviarValoracion = async () => {
    if (!estrellas) return;
    const ok = await guardar({ rating: estrellas, comment: comentario });
    if (ok) { setEstrellas(0); setComentario(''); }
  };

  // fake thumbnails using same emoji/image
  const thumbs = [0, 1, 2];

  const recomendados = todosLosProductos
    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
    .slice(0, 5);

  const handleAgregar = () => {
    onAgregarAlCarrito(producto, 1);
    onClose();
  };


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
              </ReviewsHeader>

              {/*
                Sin reseñas se dice sin adornos. Antes aquí había un 4.3 con
                "5,961 reseñas" que no existían: mejor una tienda honesta y
                vacía que una que finge tener miles de clientes contentos.
              */}
              {reviewCount === 0 ? (
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.5 }}>
                  Todavía nadie ha opinado sobre este producto.
                  {puedeOpinar ? ' Si ya lo compró, sea el primero.' : ''}
                </p>
              ) : (
                <>
                  <RatingSummary>
                    <BigRating>
                      <BigNumber>{rating}</BigNumber>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '4px 0 2px' }}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke={i <= Math.round(rating) ? '#f59e0b' : '#ddd'} />
                        ))}
                      </div>
                      <BigLabel>({reviewCount})</BigLabel>
                    </BigRating>
                    <RatingBars>
                      {barras.map(row => (
                        <RatingBarRow key={row.stars}>
                          <span style={{ minWidth: 8 }}>{row.stars}</span>
                          <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                          <BarBg><BarFill $pct={row.pct} /></BarBg>
                          <BarCount>{row.count}</BarCount>
                        </RatingBarRow>
                      ))}
                    </RatingBars>
                  </RatingSummary>

                  {reviews.map(r => {
                    const nombre = r.clientId?.fullName || 'Cliente';
                    return (
                      <ReviewCard key={r._id}>
                        <ReviewerRow>
                          <Avatar>{nombre[0]}</Avatar>
                          <div>
                            <ReviewerName>{nombre}</ReviewerName>
                            <ReviewDate>{haceCuanto(r.createdAt)}</ReviewDate>
                          </div>
                        </ReviewerRow>
                        <ReviewStars>
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={12} fill={i <= r.rating ? '#f59e0b' : 'none'} stroke={i <= r.rating ? '#f59e0b' : '#ddd'} />
                          ))}
                        </ReviewStars>
                        {r.comment && <ReviewText>{r.comment}</ReviewText>}
                      </ReviewCard>
                    );
                  })}
                </>
              )}

              {/*
                Dejar opinión. Solo se ofrece a clientes; el servidor además
                exige haber comprado el producto, así que una reseña de aquí
                vale algo.
              */}
              {puedeOpinar && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#333', margin: '0 0 8px' }}>
                    {miValoracion ? 'Su opinión' : 'Deje su opinión'}
                  </p>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(i => {
                      const marcada = i <= (estrellas || miValoracion?.rating || 0);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEstrellas(i)}
                          aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
                          style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                        >
                          <Star size={20} fill={marcada ? '#f59e0b' : 'none'} stroke={marcada ? '#f59e0b' : '#ccc'} />
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={miValoracion?.comment || 'Cuente cómo le fue con el producto (opcional)'}
                    style={{
                      width: '100%', border: '1px solid #e5e5e5', borderRadius: 10,
                      padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={enviarValoracion}
                    disabled={!estrellas || guardando}
                    style={{
                      marginTop: 8, width: '100%', padding: '9px 0', borderRadius: 999,
                      border: 'none', background: estrellas ? BROWN : '#e5e5e5',
                      color: estrellas ? '#fff' : '#999', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {guardando ? 'Enviando…' : miValoracion ? 'Actualizar mi opinión' : 'Enviar opinión'}
                  </button>
                </div>
              )}
            </ReviewsBlock>

            {/*
              Aquí iban tres desplegables: "Detalles", "Conservación y
              almacenamiento" e "Ingredientes o Valor Nutricional". Los dos
              últimos eran texto de relleno idéntico en todos los productos
              ("consulte la etiqueta"), y el primero repetía la categoría y el
              stock que ya se ven arriba. Ocupaban media pantalla sin decir
              nada, así que se quitaron.
            */}

            {/* Recommendations */}
            {recomendados.length > 0 && (
              <RecsSection>
                <RecsTitle>Recomendaciones</RecsTitle>
                {/*
                  La MISMA tarjeta que la tienda. Antes esto tenía su propio
                  diseño —más chico, con el stock en inglés ("5 Left") y el
                  click vacío, literalmente un comentario donde debía abrirse
                  el producto—. Reusarla arregla las tres cosas de una y evita
                  que dentro de la misma pantalla haya dos formas de mostrar
                  un producto.
                */}
                <RecsGrid>
                  {recomendados.map(p => (
                    <ProductCard
                      key={p.id}
                      producto={p}
                      onVerDetalle={onVerProducto || (() => {})}
                      onAgregarAlCarrito={onAgregarAlCarrito}
                    />
                  ))}
                </RecsGrid>
              </RecsSection>
            )}
          </LeftCol>

          {/* ── Right column: sticky info ── */}
          <RightCol>
            <BrandTag>{producto.marca}</BrandTag>
            <ProductName>{producto.nombre}</ProductName>

            {/* Las estrellas de arriba solo aparecen si alguien opinó */}
            {reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke={i <= Math.round(rating) ? '#f59e0b' : '#ddd'} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#888' }}>
                  {rating} ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            {/*
              El cliente ve si hay o no hay, no cuántas quedan: el inventario
              es asunto de la tienda. Antes había además un "$2.71/lb" fijo,
              igual para el queso que para las Pringles, y un "75 Left" a
              medio traducir.
            */}
            <PriceLine>
              {producto.precioAnterior && <OldPrice>${Number(producto.precioAnterior).toFixed(2)}</OldPrice>}
              <NewPrice>${Number(producto.precio).toFixed(2)}</NewPrice>
              <StockBadge $low={producto.stock === 0}>
                {producto.stock === 0 ? 'Agotado' : '✓ En stock'}
              </StockBadge>
            </PriceLine>

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
              {/*
                Aquí decía "100% Natural" en TODOS los productos, incluidos el
                cloro y las Pringles. Era una afirmación sobre la mercadería
                que la tienda no hizo y que en varios casos es falsa.
              */}
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