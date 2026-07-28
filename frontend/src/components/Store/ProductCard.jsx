import { useState } from 'react';
import { Package } from 'lucide-react';
import styled from 'styled-components';
import { useFavoritosCtx } from '../../context/FavoritosContext';

// Paleta del diseño (WEB.pdf), medida sobre el mockup.
const BROWN = '#B46C30';
const BROWN_DARK = '#8A5222';

const Card = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    transform: translateY(-4px);
  }
`;

/*
 * El recuadro de la foto: un panel redondeado DENTRO de la tarjeta, con aire
 * blanco alrededor, en vez de la imagen pegada a los bordes de arriba.
 *
 * No es adorno: el marco le da a cada producto el mismo escenario. Con fotos
 * de proveedores distintos —unas con fondo blanco, otras recortadas, otras
 * cuadradas— la fila se veía despareja; encuadradas todas igual, la vista
 * compara productos en vez de tropezar con las fotos.
 */
const ImageWrapper = styled.div`
  background: #F4F4F5;
  height: 165px;
  margin: 10px 10px 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  /* El margen interno que hace que todas las fotos respiren igual */
  padding: 14px;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  /*
   * contain y no cover: con cover el navegador recorta lo que le sobra para
   * llenar la caja, y a una foto vertical le comía la mitad — a la pera se le
   * perdía la punta y a las uvas los bordes. Las fotos de producto vienen de
   * mil tamaños distintos (unas cuadradas del proveedor, otras del celular),
   * así que ninguna caja fija les queda bien a todas: mejor que entren
   * completas dentro del mismo marco.
   */
  object-fit: contain;
  transition: transform 0.3s ease;

  ${Card}:hover & {
    transform: scale(1.06);
  }
`;

/* Marcador de producto sin foto: icono de línea, no un emoji de sistema. */
const ImageFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C4BDB6;
  user-select: none;
`;

/*
 * El corazón y la etiqueta se anclan a la TARJETA, no al recuadro: si fueran
 * hijos del recuadro, el margen nuevo los empujaría hacia adentro y quedarían
 * flotando en medio de la foto.
 */
const WishlistButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: white;
  border: none;
  font-size: 17px;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  z-index: 2;
  color: ${props => props.$liked ? '#ff4d6d' : '#ccc'};

  &:hover {
    transform: scale(1.15);
    color: #ff4d6d;
  }
`;

const BestSellerBadge = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: ${BROWN};
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radio-pill);
  letter-spacing: 0.2px;
  z-index: 2;
`;

const CardBody = styled.div`
  padding: 12px 14px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProductBrand = styled.div`
  font-size: 10px;
  color: #aaa;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
`;

const ProductName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111;
  margin-bottom: 2px;
  line-height: 1.3;
`;

/* En el diseño el "quedan N" siempre va en rojo: es lo que empuja a comprar. */
const StockInfo = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${props => (props.$bajoStock ? '#D8542C' : '#E0763F')};
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const OldPrice = styled.span`
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
  line-height: 1;
`;

const NewPrice = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  line-height: 1.1;
`;

/*
 * En el diseño este botón es NEGRO, no café. Es a propósito: el acento de la
 * marca es el café, y el negro hace que la acción de agregar resalte sobre él
 * en vez de competirle.
 */
const AddButton = styled.button`
  background: var(--tinta);
  color: white;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 21px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  flex-shrink: 0;
  line-height: 1;

  &:hover {
    background: #000;
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Acepta className/style para que la grilla pueda escalonar su entrada.
const ProductCard = ({ producto, onVerDetalle, onAgregarAlCarrito, className, style }) => {
  /*
   * El corazón sale del contexto, no de un useState local: así lo que se
   * marcó queda guardado en la cuenta y sigue encendido al volver mañana.
   */
  const { esFavorito, alternar } = useFavoritosCtx();
  const liked = esFavorito(producto.id);
  const [imgError, setImgError] = useState(false);

  const bajoStock = producto.stock < 10;

  const handleClickCard = (e) => {
    if (e.target.closest('.add-button')) return;
    if (e.target.closest('.wishlist-button')) return;
    onVerDetalle(producto);
  };

  const handleAgregar = (e) => {
    e.stopPropagation();
    onAgregarAlCarrito(producto);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    alternar(producto.id, producto.nombre);
  };

  return (
    <Card onClick={handleClickCard} className={className} style={style}>
      {producto.promo && (
        <BestSellerBadge>
          {producto.promo.type === 'nxm'
            ? `${producto.promo.buyQty}x${producto.promo.payQty}`
            : producto.promo.type === 'descuento'
              ? `-${producto.promo.discount}%`
              : producto.promo.type === 'anuncio'
                ? (producto.promo.etiqueta || 'Nuevo')
                : 'Oferta'}
        </BestSellerBadge>
      )}
      <WishlistButton
        className="wishlist-button"
        onClick={handleWishlist}
        $liked={liked}
      >
        {liked ? '♥' : '♡'}
      </WishlistButton>

      <ImageWrapper>
        {producto.imagen && !imgError ? (
          <ProductImage
            src={producto.imagen}
            alt={producto.nombre}
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageFallback><Package size={38} strokeWidth={1.4} /></ImageFallback>
        )}
      </ImageWrapper>

      <CardBody>
        <ProductBrand>{producto.marca}</ProductBrand>
        <ProductName>{producto.nombre}</ProductName>
        <StockInfo $bajoStock={bajoStock}>
          {bajoStock ? `⚠️ Solo ${producto.stock}` : `${producto.stock} disponibles`}
        </StockInfo>

        <PriceRow>
          <PriceBlock>
            {producto.precioAnterior && (
              <OldPrice>${Number(producto.precioAnterior).toFixed(2)}</OldPrice>
            )}
            <NewPrice>${Number(producto.precio).toFixed(2)}</NewPrice>
          </PriceBlock>
          <AddButton className="add-button" onClick={handleAgregar}>+</AddButton>
        </PriceRow>
      </CardBody>
    </Card>
  );
};

export default ProductCard;