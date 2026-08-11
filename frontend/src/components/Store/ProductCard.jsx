import { useState } from 'react';
import { Package, Lock } from 'lucide-react';
import styled from 'styled-components';
import { useFavoritosCtx } from '../../context/FavoritosContext';
import { useEdad } from '../../context/EdadContext';
import { esPorLibra, esSoloAdultos, piezasEnTexto } from '../../utils/unidades';

// Paleta del diseño (WEB.pdf), medida sobre el mockup.
const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';

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

  /*
   * El levantarse al pasar el cursor es solo del ratón: en pantalla táctil un
   * toque deja el hover pegado, y la tarjeta se quedaba flotando y con sombra
   * después de haberla soltado, como si siguiera seleccionada.
   */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
      transform: translateY(-4px);
    }
  }

  /* Lo que el dedo sí recibe a cambio: el hundido al apretar. */
  &:active { transform: scale(0.98); }
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

  @media (hover: hover) and (pointer: fine) {
    ${Card}:hover & {
      transform: scale(1.06);
    }
  }
`;

/*
 * Cobertura de los productos +18: tapa la foto con desenfoque hasta que la
 * persona confirme su edad. Va sobre el recuadro de la imagen, no sobre toda
 * la tarjeta, para que el nombre y el precio se sigan leyendo (el cliente tiene
 * que saber qué es y cuánto cuesta antes de decidir confirmar su edad).
 */
const CoberturaEdad = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(28, 22, 20, 0.72);
  backdrop-filter: blur(6px);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  padding: 10px;
  z-index: 3;
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

  /*
   * El corazón mide 34px porque a 34px se ve bien: más grande le robaría
   * protagonismo a la foto del producto. Pero un dedo necesita 44px, y entre
   * los clientes hay personas mayores.
   *
   * La salida es separar lo que se VE de lo que se TOCA: el botón sigue
   * midiendo 34, y un pseudo-elemento invisible le extiende el área hasta 44.
   * Solo en pantallas de dedo (pointer: coarse) — con mouse no hace falta y
   * un área invisible de más se comería el hover de lo que tiene al lado.
   */
  @media (pointer: coarse) {
    &::after {
      content: '';
      position: absolute;
      inset: -5px;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: scale(1.15);
      color: #ff4d6d;
    }
  }
  &:active { transform: scale(0.92); }

  /*
   * El corazón mide 34px y con el dedo eso se falla — y fallarlo aquí no es
   * inocente: el toque cae en la tarjeta y abre el producto. Se le agranda el
   * área de toque con un rectángulo invisible, sin tocar lo que se ve: 34px es
   * lo que el diseño pide, 46px es lo que el pulgar necesita.
   */
  @media (pointer: coarse), (max-width: 560px) {
    &::after {
      content: '';
      position: absolute;
      inset: -6px;
    }
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
 * El "/lb" va más chico y más tenue que el número: acompaña al precio, no
 * compite con él. Del mismo tamaño se leería como parte de la cifra.
 */
const PorUnidad = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--tinta-tenue);
  margin-left: 1px;
`;

/* Cuántas trae el paquete. Va debajo del precio, chiquito: acompaña, no compite. */
const Contenido = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--tinta-tenue);
  margin-top: 1px;
`;

/*
 * El +18. Va en el rojo de los avisos y no en el café de la marca: no es una
 * característica que se presume, es una condición para poder comprarlo.
 */
const Marca18 = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: var(--radio-pill);
  background: var(--alerta);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  vertical-align: middle;
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
  position: relative;

  /*
   * Agregar al carrito es LA acción de la tienda, y con el pulgar medía 38px.
   * Mismo truco que el corazón: el cuadro negro se queda en 38 —que es lo que
   * pide el diseño— y el área que responde al dedo llega a 44.
   */
  @media (pointer: coarse) {
    &::after {
      content: '';
      position: absolute;
      inset: -3px;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: #000;
      transform: scale(1.08);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  /* Mismo criterio que el corazón: 38px se ven, 48px se tocan. Este botón es
     el que mete el producto al carrito — errarle cuesta una venta. */
  @media (pointer: coarse), (max-width: 560px) {
    &::after {
      content: '';
      position: absolute;
      inset: -5px;
    }
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

  // Candado +18: si el producto es restringido y aún no confirmó su edad, se
  // tapa y cada intento (ver o agregar) pasa antes por la confirmación.
  const { mayorConfirmado, pedirConfirmacion } = useEdad();
  const tapado = esSoloAdultos(producto) && !mayorConfirmado;

  const bajoStock = producto.stock < 10;

  const handleClickCard = (e) => {
    if (e.target.closest('.add-button')) return;
    if (e.target.closest('.wishlist-button')) return;
    if (tapado) { pedirConfirmacion(() => onVerDetalle(producto)); return; }
    onVerDetalle(producto);
  };

  const handleAgregar = (e) => {
    e.stopPropagation();
    if (tapado) { pedirConfirmacion(() => onAgregarAlCarrito(producto)); return; }
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

        {tapado && (
          <CoberturaEdad>
            <Lock size={20} />
            <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>Mayores de 18</span>
            <span style={{ fontSize: 10.5, opacity: 0.85, lineHeight: 1.25 }}>Tocá para confirmar tu edad</span>
          </CoberturaEdad>
        )}
      </ImageWrapper>

      <CardBody>
        <ProductBrand>{producto.marca}</ProductBrand>
        <ProductName>
          {producto.nombre}
          {/* +18 pegado al nombre: es una condición para comprarlo, no un
              adorno. Mejor enterarse aquí que en la puerta de la casa. */}
          {esSoloAdultos(producto) && <Marca18>+18</Marca18>}
        </ProductName>
        {/*
          Solo se avisa cuando se está acabando o cuando ya no hay. Poner
          "100 disponibles" en cada tarjeta le enseña el inventario al cliente
          sin que le sirva de nada; lo que sí lo mueve es saber que quedan
          pocas.
        */}
        {producto.stock === 0 ? (
          <StockInfo $bajoStock>Agotado</StockInfo>
        ) : bajoStock ? (
          <StockInfo $bajoStock>¡Quedan pocas!</StockInfo>
        ) : null}

        <PriceRow>
          <PriceBlock>
            {producto.precioAnterior && (
              <OldPrice>${Number(producto.precioAnterior).toFixed(2)}</OldPrice>
            )}
            {/*
              El "/lb" pegado al precio y no en un renglón aparte: es parte del
              precio, no un dato adicional. Sin él, "$1.25" en un tomate se lee
              como lo que cuesta ese tomate — y eso es cobrar una cosa
              aparentando otra. Ver utils/unidades.js.
            */}
            <NewPrice>
              ${Number(producto.precio).toFixed(2)}
              {esPorLibra(producto) && <PorUnidad>/lb</PorUnidad>}
            </NewPrice>
            {/*
              "Trae 6 unidades" debajo del precio: sin eso, $3.00 se lee igual
              para un six-pack que para una lata suelta, y el cliente no tiene
              cómo comparar. Solo sale si la tienda lo declaró.
            */}
            {!esPorLibra(producto) && piezasEnTexto(producto) && (
              <Contenido>{piezasEnTexto(producto)}</Contenido>
            )}
          </PriceBlock>
          <AddButton className="add-button" onClick={handleAgregar}>+</AddButton>
        </PriceRow>
      </CardBody>
    </Card>
  );
};

export default ProductCard;