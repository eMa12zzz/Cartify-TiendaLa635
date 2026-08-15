import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, ShoppingBag, ChevronRight, ChevronLeft, Package, MessageCircle } from 'lucide-react';
import { useEdad } from '../../context/EdadContext';
import ProductCard from './ProductCard';
import { esPorLibra, esSoloAdultos, piezasEnTexto } from '../../utils/unidades';

const BROWN = 'var(--marca-600)';
const BROWN_LIGHT = 'var(--marca-100)';
const BROWN_DARK = 'var(--marca-700)';

/*
 * El aviso de venta restringida. Rojo tenue y con borde: tiene que leerse como
 * una condición, no como una promoción más.
 */
const AvisoAdultos = styled.div`
  background: #FDF0EC;
  border: 1px solid #F3C7BA;
  color: #8A2B12;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  margin-bottom: 12px;
`;

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

  // onClose siempre fresco para los listeners de abajo, sin re-armarlos.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // UN SOLO SCROLL: el overlay ya scrollea por dentro; sin congelar el de la
  // página de atrás quedaban dos barras independientes peleando.
  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflowPrevio; };
  }, []);

  /*
   * EL "ATRÁS" DEL NAVEGADOR CIERRA EL DETALLE. Sin esto, con el modal abierto
   * la flecha del navegador salía de la tienda —y si se venía del login,
   * devolvía ahí—. Metemos una entrada de historia: el "atrás" la consume,
   * dispara popstate y aquí solo cerramos el modal.
   *
   * OJO: NO se llama history.back() en la limpieza. En StrictMode (dev) el
   * efecto se monta→desmonta→monta, y ese back() asíncrono terminaba
   * disparándose después de re-montar y cerraba el modal al instante — o sea,
   * "no se veía ningún producto". Dejar la entrada extra es inofensivo; el
   * próximo "atrás" solo la consume sin salir de la tienda.
   */
  useEffect(() => {
    window.history.pushState({ modalProducto: true }, '');
    const alVolver = () => onCloseRef.current?.();
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  // Los que se venden por peso muestran el precio de la libra y se agregan de
  // libra en libra. Ver utils/unidades.js.
  const porLibra = esPorLibra(producto);

  const recomendados = todosLosProductos
    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
    .slice(0, 5);

  // Candado +18 también aquí: agregar un producto restringido pasa antes por
  // la confirmación de edad. Normalmente ya se confirmó al abrir el detalle,
  // pero este es el paso que de verdad mete el producto al carrito.
  const { mayorConfirmado, pedirConfirmacion } = useEdad();

  const handleAgregar = () => {
    const meter = () => { onAgregarAlCarrito(producto, 1); onClose(); };
    if (esSoloAdultos(producto) && !mayorConfirmado) {
      pedirConfirmacion(meter);
      return;
    }
    meter();
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
              {/*
                Una sola imagen: el producto tiene UNA foto. Antes había una
                tira de tres miniaturas que repetían la misma imagen, dando a
                entender que había varias vistas cuando no las hay.
              */}
              <MainImageWrapper>
                {producto.esMasVendido && <BestBadge>Los más vendidos</BestBadge>}
                {producto.imagen && !imgError
                  ? <MainImage src={producto.imagen} alt={producto.nombre} onError={() => setImgError(true)} />
                  : <ImageFallback><Package size={72} strokeWidth={1.2} /></ImageFallback>
                }
              </MainImageWrapper>
            </ImageArea>

            {/*
              Aquí iba el bloque de reseñas del PRODUCTO. Se quitó a propósito:
              lo que se valora en esta tienda es el SERVICIO de entrega, no el
              producto, y esa valoración se pide en "Mis pedidos" cuando el
              pedido a domicilio ya llegó. Ver MisPedidos y order.serviceRating.
            */}

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

            {/*
              El cliente ve si hay o no hay, no cuántas quedan: el inventario
              es asunto de la tienda.

              Ojo con el "/lb": aquí hubo una vez un "$2.71/lb" CLAVADO, igual
              para el queso que para las Pringles, y se quitó por mentiroso.
              El de ahora es lo contrario: sale del propio producto, solo
              aparece en los que de verdad se venden por peso, y el número es
              el que se cobra. Ver utils/unidades.js.
            */}
            <PriceLine>
              {producto.precioAnterior && <OldPrice>${Number(producto.precioAnterior).toFixed(2)}</OldPrice>}
              <NewPrice>
                ${Number(producto.precio).toFixed(2)}
                {porLibra && <span style={{ fontSize: 14, fontWeight: 600, color: '#9C9691' }}>/lb</span>}
              </NewPrice>
              <StockBadge $low={producto.stock === 0}>
                {producto.stock === 0 ? 'Agotado' : '✓ En stock'}
              </StockBadge>
            </PriceLine>

            {/*
              El aviso de +18 va ANTES del botón, no después: enterarse de que
              le van a pedir documento cuando el repartidor ya está en la puerta
              es la peor manera de saberlo. Y se dice completo —qué se pide y
              qué pasa si no lo tiene— porque media advertencia no advierte.
            */}
            {esSoloAdultos(producto) && (
              <AvisoAdultos>
                <strong>Solo para mayores de 18 años.</strong> Se le pedirá su documento de
                identidad al entregar el pedido. Sin él, este producto no se puede entregar.
              </AvisoAdultos>
            )}

            <AddBtn onClick={handleAgregar} disabled={producto.stock === 0}>
              <ShoppingBag size={18} />
              {porLibra ? 'Añadir una libra al carrito' : 'Añadir al carrito'}
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
                /*
                  pre-line respeta los enter que escribió quien cargó el
                  producto. HTML colapsa los saltos de línea por defecto, así
                  que una descripción escrita en renglones —"Peso: 500g" en uno,
                  "Origen: nacional" en otro— salía toda pegada en un párrafo.
                  Es "pre-line" y no "pre" a propósito: respeta los enter pero
                  sigue acomodando el texto al ancho de la tarjeta.
                */
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginTop: 12, whiteSpace: 'pre-line' }}>
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