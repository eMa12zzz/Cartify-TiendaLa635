import { useState } from 'react';
import styled from 'styled-components';

const BROWN = '#8B5A2B';
const BROWN_DARK = '#5a3a1a';

const Card = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    transform: translateY(-4px);
  }
`;

const ImageWrapper = styled.div`
  background: #f7f7f7;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${Card}:hover & {
    transform: scale(1.06);
  }
`;

const ImageFallback = styled.div`
  font-size: 64px;
  user-select: none;
`;

const WishlistButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
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
  transition: all 0.2s;
  z-index: 2;
  color: ${props => props.$liked ? '#ff4d6d' : '#ccc'};

  &:hover {
    transform: scale(1.15);
    color: #ff4d6d;
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
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

const StockInfo = styled.div`
  font-size: 10px;
  color: ${props => props.$bajoStock ? '#ef4444' : '#9ca3af'};
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

const AddButton = styled.button`
  background: ${BROWN};
  color: white;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;

  &:hover {
    background: ${BROWN_DARK};
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProductCard = ({ producto, onVerDetalle, onAgregarAlCarrito }) => {
  const [liked, setLiked] = useState(false);
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
    setLiked(prev => !prev);
  };

  return (
    <Card onClick={handleClickCard}>
      <ImageWrapper>
        {producto.esMasVendido && <BestSellerBadge>Más vendido</BestSellerBadge>}
        <WishlistButton
          className="wishlist-button"
          onClick={handleWishlist}
          $liked={liked}
        >
          {liked ? '♥' : '♡'}
        </WishlistButton>
        {producto.imagen && !imgError ? (
          <ProductImage
            src={producto.imagen}
            alt={producto.nombre}
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageFallback>{producto.emoji || '📦'}</ImageFallback>
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