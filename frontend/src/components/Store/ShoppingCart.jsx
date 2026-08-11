import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { X, Minus, Plus, Trash2, ShoppingBag, ChevronLeft, CreditCard, MapPin, ChevronRight, Check, Package, MessageCircle, Store as StoreFront, CalendarDays, Hash, Wallet, Gift, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useLoyalty } from '../../hooks/useLoyalty';
import { useSaldo } from '../../hooks/useSaldo';
import { useDireccionCtx } from '../../context/DireccionContext';
import { useTiempoPorZona } from '../../hooks/useTiempoPorZona';
import { orderService } from '../../api/orderService';
import { esPorLibra, pasoDe, ajustarCantidad, cantidadConUnidad } from '../../utils/unidades';
// El nombre de la tienda sale de los ajustes; el carrito y el recibo se habían
// quedado con el escrito a mano. Ver AjustesContext.
import { useAjustesCtx } from '../../context/AjustesContext';

// Productos por página en el resumen del pedido confirmado.
const POR_PAGINA = 4;

const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';
const BROWN_LIGHT = 'var(--marca-100)';

// Los tres campos de la dirección nueva se ven igual; el estilo vive aquí
// para no repetirlo tres veces y que uno se quede distinto el día que cambie.
const estiloCampoDireccion = {
  width: '100%',
  padding: '10px 13px',
  fontSize: 13,
  fontFamily: 'inherit',
  border: '1px solid #e0d3c4',
  borderRadius: 10,
  outline: 'none',
  background: '#fff',
};

/*
 * El carrito entra con TRANSICIONES, no con @keyframes.
 * Motivo: una transición se puede interrumpir y retomar desde donde va; los
 * keyframes reinician desde cero. Si el cliente abre y cierra rápido, esto se
 * siente natural en vez de dar un brinco.
 */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
  opacity: ${p => (p.$montado ? 1 : 0)};
  transition: opacity var(--dur-popover) var(--ease-out);
`;

/*
 * 100dvh y no 100vh, en los dos paneles.
 *
 * En el teléfono 100vh mide la pantalla SIN la barra de direcciones del
 * navegador, así que el panel quedaba más alto que lo que de verdad se ve y su
 * último tramo caía por debajo. En el carrito ese último tramo es justo el
 * botón de pagar: la persona llenaba el carrito, abría el panel y el botón no
 * estaba en ninguna parte. La unidad dvh sí mide lo visible.
 *
 * Se deja el 100vh arriba como respaldo para el navegador que no la conozca.
 */
const ALTO_PANTALLA = `
  height: 100vh;
  height: 100dvh;
`;

/* Full-width panel for checkout & confirmation */
const FullPanel = styled.div`
  background: #f5f5f5;
  width: 100%;
  ${ALTO_PANTALLA}
  display: flex;
  flex-direction: column;
  transform: translateX(${p => (p.$montado ? '0' : '100%')});
  /* Más ágil: la curva de "drawer" tenía una cola muy lenta que se sentía
     pesada al abrir. Con dur-modal + ease-out entra rápido y limpio. */
  transition: transform var(--dur-modal) var(--ease-out);
  overflow-y: auto;
  overscroll-behavior: contain;
`;

/* Slide-in cart panel */
const CartPanel = styled.div`
  background: white;
  width: 100%;
  max-width: 440px;
  ${ALTO_PANTALLA}
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 40px rgba(0,0,0,0.12);
  transform: translateX(${p => (p.$montado ? '0' : '100%')});
  /* Más ágil: la curva de "drawer" tenía una cola muy lenta que se sentía
     pesada al abrir. Con dur-modal + ease-out entra rápido y limpio. */
  transition: transform var(--dur-modal) var(--ease-out);
`;

/* ── SHARED TOP BAR ── */
const PageTopBar = styled.div`
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 10px;

  @media (max-width: 560px) { padding: 10px 14px; }
`;

const BrandTitle = styled.div`
  text-align: center;
  flex: 1;
`;

const BrandSub = styled.div`font-size: 11px; color: #aaa; line-height: 1;`;
const BrandMain = styled.div`font-size: 18px; font-weight: 800; color: #111; line-height: 1.2;`;

const BackBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #555;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* Volver del checkout al carrito con el pulgar: 28px no alcanzaban. */
  min-width: 44px;
  min-height: 44px;

  @media (hover: hover) and (pointer: fine) {
    &:hover { color: ${BROWN}; }
  }
  &:active { transform: scale(0.94); }
`;

const HelpBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 30px;
  background: white;
  font-size: 12px;
  color: #444;
  cursor: pointer;
  flex-shrink: 0;
  min-height: 40px;
  white-space: nowrap;

  @media (hover: hover) and (pointer: fine) {
    &:hover { border-color: ${BROWN}; color: ${BROWN}; }
  }
  &:active { transform: scale(0.97); }
`;

/* ── CART PANEL elements ── */
const CartHeader = styled.div`
  padding: 18px 22px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;

  /* 12px menos de margen a cada lado es un producto más ancho por renglón. */
  @media (max-width: 480px) { padding: 14px 16px; }
`;

const CartTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ItemCount = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #888;
`;

const CloseButton = styled.button`
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  color: #666;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  &:hover { background: #ebebeb; color: #111; }
`;

const CartItemsScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 22px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

  @media (max-width: 480px) { padding: 10px 16px; }
`;

const StoreName = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 6px;
`;

const StoreIcon = styled.div`
  width: 38px;
  height: 38px;
  background: ${BROWN_LIGHT};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const StoreInfo = styled.div`
  .name { font-size: 14px; font-weight: 600; color: #111; }
  .sub { font-size: 11px; color: #888; }
`;

const ProductsLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 6px;
`;

const CartItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f7f7f7;
`;

const ItemImgBox = styled.div`
  width: 52px;
  height: 52px;
  background: #f7f3ef;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Mismo criterio que las tarjetas: la foto entra entera, no recortada */
  padding: 5px;
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .emoji { font-size: 26px; }
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemPriceLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
`;

const ItemOldPrice = styled.span`
  font-size: 11px;
  color: #bbb;
  text-decoration: line-through;
`;

const ItemPrice = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${BROWN};
`;

// El "/lb" acompaña al precio sin competir con él.
const UnidadChica = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--tinta-tenue);
`;

const QtyControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

/*
 * Los botones de cantidad crecen en el teléfono.
 *
 * A 26px son dos blancos de la mitad del pulgar, pegados uno al otro y con el
 * bote de basura al lado: equivocarse aquí no es un tropiezo, es borrar un
 * producto que se quería llevar. En pantalla táctil pasan a 34px de caja y
 * 44px de área de toque; con el ratón se quedan como estaban.
 */
const QtyBtn = styled.button`
  width: 26px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  color: #444;

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: ${BROWN_LIGHT}; border-color: ${BROWN}; color: ${BROWN}; }
  }
  &:active:not(:disabled) { transform: scale(0.94); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (pointer: coarse), (max-width: 560px) {
    width: 34px;
    height: 34px;
    &::after { content: ''; position: absolute; inset: -5px; }
  }
`;

const QtyNum = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #111;
  min-width: 22px;
  text-align: center;
`;

const ItemTotal = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111;
  text-align: right;
  flex-shrink: 0;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #ddd;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
  position: relative;

  @media (hover: hover) and (pointer: fine) {
    &:hover { color: #ef4444; }
  }

  /*
   * Separado del menos, no pegado: es el único botón de esta fila que no se
   * puede deshacer, y estaba a 6px del que solo baja la cantidad.
   */
  @media (pointer: coarse), (max-width: 560px) {
    width: 34px;
    height: 34px;
    margin-right: 6px;
    &::after { content: ''; position: absolute; inset: -5px; }
  }
`;

const EmptyCart = styled.div`
  /*
   * Columna centrada, no solo text-align. Tailwind pone svg { display:block },
   * así que el icono es un bloque y text-align no lo centra: quedaba pegado a
   * la izquierda mientras el texto sí se centraba. Con flex se centran los tres.
   */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;      /* lo deja a media altura del panel, no pegado arriba */
  padding: 40px 20px;
  color: #aaa;
  .emoji { margin-bottom: 14px; color: #c9c2ba; }
  .title { font-size: 16px; font-weight: 600; color: #555; margin-bottom: 6px; }
  .sub { font-size: 13px; }
`;

/* Cart footer */
const CartFooter = styled.div`
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: white;

  /*
   * El área segura del iPhone. Sin esto la barra de gestos de abajo se come el
   * borde del botón de pagar, y aunque se alcance a tocar, un botón mordido
   * por el borde de la pantalla no invita a apretarlo con la plata de por
   * medio.
   */
  padding-bottom: env(safe-area-inset-bottom);
`;

const OrderSummaryBox = styled.div`
  padding: 16px 22px 12px;

  @media (max-width: 480px) { padding: 14px 16px 10px; }
`;

const SummaryTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #111;
  margin-bottom: 10px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  span:last-child { color: #111; font-weight: 500; }
`;

const Divider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 10px 0;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const TotalLabel = styled.span`font-size: 15px; font-weight: 700; color: #111;`;
const TotalPrice = styled.span`font-size: 22px; font-weight: 800; color: #111;`;

const BtnRow = styled.div`
  padding: 0 22px 20px;
  display: flex;
  gap: 10px;

  @media (max-width: 480px) { padding: 0 16px 16px; }
`;

const ClearBtn = styled.button`
  padding: 13px 16px;
  min-height: 48px;
  flex-shrink: 0;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  background: white;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  white-space: nowrap;
  &:hover { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }
`;

const CheckoutBtn = styled.button`
  flex: 1;
  padding: 13px;
  /* El botón que cobra: nunca por debajo del pulgar. */
  min-height: 48px;
  min-width: 0;
  border: none;
  border-radius: 14px;
  background: ${BROWN};
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: ${BROWN_DARK}; }
  }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

/* ── CHECKOUT VIEW ── */
const CheckoutLayout = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 28px 60px;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 28px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  /*
   * En el teléfono el margen baja a 14px y el de abajo sube, con el área
   * segura incluida: el resumen con el botón de pagar es lo último de la
   * página, y sin este colchón quedaba pegado al borde inferior.
   */
  @media (max-width: 560px) {
    padding: 18px 14px calc(40px + env(safe-area-inset-bottom));
    gap: 16px;
  }
`;

const CheckoutLeft = styled.div``;

const CheckoutCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const CheckoutSection = styled.div`
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafafa; }
`;

const CheckoutSectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 2px;
`;

const CheckoutSectionSub = styled.div`
  font-size: 13px;
  color: ${BROWN};
  font-weight: 500;
`;

const CheckoutIconBox = styled.div`
  width: 42px;
  height: 42px;
  background: ${BROWN_LIGHT};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
`;

const DeliveryBadge = styled.div`
  background: #f0f0f0;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  color: #444;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  svg { flex-shrink: 0; }
`;

const OrderThumbsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 24px;

  /*
   * Seis miniaturas de 48px no caben en 347px de tarjeta, y como la tarjeta
   * recorta lo que se sale, las últimas desaparecían sin dejar rastro. Que
   * bajen de renglón.
   */
  flex-wrap: wrap;

  @media (max-width: 560px) { padding: 14px 16px; }
`;

const OrderThumb = styled.div`
  width: 48px;
  height: 48px;
  background: #f7f3ef;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  padding: 4px;
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
`;

const MoreBadge = styled.div`
  width: 48px;
  height: 48px;
  background: ${BROWN_LIGHT};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: ${BROWN};
`;

/* Checkout right: order summary */
const SummaryCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  position: sticky;
  top: 20px;

  /*
   * En una sola columna el sticky no tiene contra qué pegarse (es el último
   * bloque del flujo) y encima lo dejaba flotando raro al rebotar el scroll.
   * Abajo del formulario, quieto, que es donde se lee el total y se paga.
   */
  @media (max-width: 768px) { position: static; }
  @media (max-width: 560px) { padding: 18px 16px; }
`;

const SummaryCardTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin-bottom: 16px;
`;

const SummaryCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  span:last-child { color: #111; font-weight: 500; }
`;

const TotalBig = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #111;
`;

/* Tips */
const TipsSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
`;

const TipsLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
  margin-bottom: 4px;
`;

const TipsSub = styled.div`
  font-size: 11px;
  color: #888;
  margin-bottom: 10px;
`;

const TipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TipBtn = styled.button`
  padding: 6px 14px;
  border: 1.5px solid ${props => props.$active ? BROWN : '#e0e0e0'};
  border-radius: 8px;
  background: ${props => props.$active ? BROWN_LIGHT : 'white'};
  color: ${props => props.$active ? BROWN : '#444'};
  font-size: 13px;
  font-weight: ${props => props.$active ? '700' : '400'};
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
`;

const CouponRow = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f5f5f5;
`;

const CouponBtn = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: ${BROWN};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { text-decoration: underline; }
`;

const PlaceOrderBtn = styled.button`
  width: 100%;
  padding: 15px;
  min-height: 52px;
  border: none;
  border-radius: 14px;
  background: ${BROWN};
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 18px;
  transition: background-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: ${BROWN_DARK}; }
  }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

/* ── CONFIRMATION VIEW ── */
const ConfirmLayout = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 28px 60px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 560px) {
    padding: 18px 14px calc(40px + env(safe-area-inset-bottom));
    gap: 16px;
  }
`;

const ConfirmCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 16px;

  @media (max-width: 560px) { padding: 20px 16px; }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #dcfce7;
  color: #15803d;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const ConfirmTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px;
`;

const ConfirmDate = styled.div`
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
`;

const CheckCircle = styled.div`
  width: 60px;
  height: 60px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

const AcceptedMsg = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin-bottom: 24px;
`;

/* Timeline */
const Timeline = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 24px;
`;

const TimelineStep = styled.div`
  flex: 1;
  text-align: center;
  position: relative;
`;

const TimelineDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${props => props.$active ? BROWN : '#e0e0e0'};
  margin: 0 auto 6px;
  position: relative;
  z-index: 1;
`;

const TimelineLine = styled.div`
  position: absolute;
  top: 6px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: ${props => props.$active ? BROWN : '#e0e0e0'};
  z-index: 0;
`;

const TimelineLabel = styled.div`
  font-size: 11px;
  color: ${props => props.$active ? BROWN : '#aaa'};
  font-weight: ${props => props.$active ? '600' : '400'};
`;

/* Products table */
const ProductsTable = styled.div``;

const PTableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  font-weight: 600;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const PTableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f7f7f7;
`;

const PImgBox = styled.div`
  width: 42px;
  height: 42px;
  background: #f7f3ef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;
  padding: 4px;
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
`;

const PName = styled.div`flex: 1; font-size: 13px; font-weight: 500; color: #111;`;
const POldPrice = styled.div`font-size: 11px; color: #bbb; text-decoration: line-through;`;
const PPrice = styled.div`font-size: 13px; color: #111; font-weight: 600;`;

const PQty = styled.div`font-size: 13px; color: #888; text-align: right; min-width: 32px;`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
`;

const PageBtn = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid ${props => props.$active ? BROWN : '#e0e0e0'};
  background: ${props => props.$active ? BROWN_LIGHT : 'white'};
  color: ${props => props.$active ? BROWN : '#444'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: ${props => props.$active ? '700' : '400'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* Right panel for confirmation */
const ConfirmSummaryCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  position: sticky;
  top: 20px;

  @media (max-width: 768px) { position: static; }
  @media (max-width: 560px) { padding: 18px 16px; }
`;

const ConfirmSummaryTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
`;

const OrderNumber = styled.div`
  font-size: 12px;
  color: ${BROWN};
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PayMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  margin-top: 12px;
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
`;

const MastercardIcon = styled.div`
  width: 32px;
  height: 20px;
  background: linear-gradient(135deg, #eb001b 50%, #f79e1b 50%);
  border-radius: 4px;
  flex-shrink: 0;
`;

/*
 * Opción del checkout (retiro/delivery, efectivo/tarjeta/saldo).
 * Tarjeta seleccionable con borde café, no un radio button suelto: en pantalla
 * táctil el área de toque es toda la tarjeta y no un círculo de 12px.
 */
const OpcionBtn = styled.button`
  /*
   * En el teléfono cada opción se lleva el renglón entero: dos de estas a la
   * par miden 130px cada una, y "Envío a domicilio · +$4.78 de envío" en 130px
   * se parte en cuatro líneas. Son cuatro decisiones en toda la compra
   * (retiro/envío, efectivo/tarjeta/saldo): bien vale un renglón cada una.
   */
  flex: 1 1 150px;
  min-width: 0;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid ${p => (p.$activa ? BROWN : '#e5e5e5')};
  background: ${p => (p.$activa ? BROWN_LIGHT : '#fff')};
  color: ${p => (p.$activa ? BROWN : '#444')};
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled) { border-color: ${BROWN}; }
  }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: 560px) { flex: 1 1 100%; }
`;

const DeliveryAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #333;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
`;

/* ── MAIN COMPONENT ── */
const ShoppingCart = ({
  items,
  total,
  onCerrar,
  onActualizarCantidad,
  onEliminarItem,
  onLimpiarCarrito,
  onCheckout,
}) => {
  const navigate = useNavigate();
  /*
   * A dónde hay que volver si por algo se sale de aquí. Antes estaba escrito
   * "/store" a mano, pero la tienda también vive en "/" y en "/seccion/…":
   * quien entraba desde la portada terminaba en otra pantalla que no era la
   * suya. La ruta de verdad la sabe el router, no nosotros.
   */
  const location = useLocation();
  const rutaActual = `${location.pathname}${location.search}`;

  const [view, setView] = useState('cart'); // 'cart' | 'checkout' | 'confirmation'
  const [procesando, setProcesando] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [orderPage, setOrderPage] = useState(1);
  // Páginas reales del resumen de productos del pedido.
  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA));

  // Marcamos "montado" en el siguiente frame para que la transición de entrada
  // corra (si pintáramos ya en su posición final, no habría nada que animar).
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /*
   * ── Entrega y pago ──
   * El envío solo se cobra si se lo llevan a la casa. Antes se cobraba
   * siempre, así que pasar a traerlo al local costaba lo mismo que el
   * delivery — no tenía sentido elegirlo.
   */
  const [entrega, setEntrega] = useState('retiro');   // 'retiro' | 'delivery'
  /*
   * La dirección se elige de las guardadas, y es la MISMA que muestra el
   * encabezado de la tienda: viene del contexto. Cambiarla aquí la cambia
   * arriba y al revés — dos lugares diciendo cosas distintas sobre a dónde
   * va el pedido es la peor manera de perder una entrega.
   */
  const {
    direcciones,
    indice: indiceDireccion,
    activa: direccionElegida,
    elegir: setIndiceDireccion,
    agregar: agregarDireccion,
    guardando: guardandoDireccion,
  } = useDireccionCtx();

  /*
   * ── Agregar una dirección SIN salir del carrito ──
   *
   * Antes este botón mandaba a la pantalla del mapa, en medio del pago. Salir
   * de la tienda para volver a entrar es el peor momento para pedirle un
   * viaje a alguien que ya tenía la plata en la mano — y el carrito, que no
   * se guardaba en ningún lado, se quedaba en el camino.
   *
   * Ahora se escribe aquí mismo. El mapa sigue estando para quien quiera
   * marcar el punto exacto, pero como una opción, no como el único camino.
   */
  const [agregandoDireccion, setAgregandoDireccion] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState({ nombre: '', direccion: '', referencia: '' });

  const irAMarcarEnElMapa = () => navigate(`/bienvenida?volver=${encodeURIComponent(rutaActual)}`);

  const guardarNuevaDireccion = (e) => {
    e.preventDefault();
    if (!nuevaDireccion.direccion.trim()) {
      toast.error('Escriba la dirección para poder llevarle el pedido');
      return;
    }
    // Las direcciones se guardan en la cuenta: sin sesión no hay dónde ponerlas.
    if (!user?.id) {
      toast('Inicie sesión para guardar su dirección');
      navigate(`/iniciar-sesion?volver=${encodeURIComponent(rutaActual)}`);
      return;
    }
    /*
     * Se deja elegida la que acaba de escribir: agregarla y que el pedido
     * siguiera saliendo a la anterior es exactamente el error que se quiso
     * evitar. Va por el índice que ocupará al final de la lista.
     */
    setIndiceDireccion(direcciones.length);
    agregarDireccion(nuevaDireccion);
    setNuevaDireccion({ nombre: '', direccion: '', referencia: '' });
    setAgregandoDireccion(false);
  };

  // Cuánto hemos tardado de verdad en llegar a esa zona (no un rango inventado).
  const zona = useTiempoPorZona(direccionElegida?.lat, direccionElegida?.lng);
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'tarjeta' | 'saldo'

  const COSTO_ENVIO = 4.78;
  const ENVIO = items.length > 0 && entrega === 'delivery' ? COSTO_ENVIO : 0;
  const SERVICIO = 0;
  const subtotal = total;
  const totalFinal = subtotal + ENVIO + SERVICIO;

  // ── Canje de puntos ──
  // `esCliente` distingue "hay sesión" de "hay sesión DE CLIENTE": en la tienda
  // la activa puede ser la del personal. Ver useAuth.
  const { user, esCliente } = useAuth();
  const { ajustes } = useAjustesCtx();
  const { saldo, canjeando, canjear, recargar: recargarSaldo } = useSaldo();
  const [codigoTarjeta, setCodigoTarjeta] = useState('');

  /*
   * Canjear la tarjeta sin salir del checkout: si el cliente tuviera que irse
   * a "Métodos de pago" a canjearla, pierde el carrito de vista y muchos no
   * vuelven. Al canjear, si el saldo alcanza, se selecciona solo como pago.
   */
  const onCanjearEnCheckout = async (e) => {
    e.preventDefault();
    if (await canjear(codigoTarjeta)) {
      setCodigoTarjeta('');
      setMetodoPago('saldo');
    }
  };
  const { points: puntosDisponibles, redeemRate, minRedeem } = useLoyalty();
  const [usarPuntos, setUsarPuntos] = useState(false);

  const puedeCanjear = puntosDisponibles >= minRedeem;
  // No dejamos canjear más de lo que valen los productos.
  const maxPuntosUtiles = Math.floor(subtotal * redeemRate);
  const puntosAUsar = usarPuntos && puedeCanjear ? Math.min(puntosDisponibles, maxPuntosUtiles) : 0;
  const descuento = Number((puntosAUsar / (redeemRate || 100)).toFixed(2));
  const totalAPagar = Math.max(0, Number((totalFinal - descuento).toFixed(2)));

  /*
   * Precio efectivo por unidad. Para las promos NxM (2x1) el cliente paga menos
   * unidades de las que lleva, así que repartimos el total de la línea entre la
   * cantidad — de esa forma el backend calcula el mismo total que ve en pantalla.
   */
  const precioEfectivo = (item) => {
    if (item.promo?.type === 'nxm') {
      const b = item.promo.buyQty || 2;
      const m = item.promo.payQty || 1;
      const grupos = Math.floor(item.cantidad / b);
      const pagados = grupos * m + (item.cantidad % b);
      return Number(((item.precio * pagados) / item.cantidad).toFixed(4));
    }
    return item.precio;
  };

  // Crea el pedido REAL. (El cobro con pasarela todavía no se conecta.)
  const handlePlaceOrder = async () => {
    /*
     * La tienda se recorre sin cuenta, pero para pagar sí hace falta: el
     * pedido tiene que ir a nombre de alguien y a una dirección. En vez de
     * dejar el aviso y que la persona busque dónde entrar, se la lleva al
     * login y se la devuelve al carrito con todo lo que ya había puesto.
     */
    /*
     * `esCliente`, no `user?.id`.
     *
     * Fuera del panel la sesión activa puede ser la del PERSONAL —un admin
     * mirando su propia tienda, que es lo normal aquí—. Con `user?.id` a secas
     * esa sesión pasaba el guarda y el pedido se guardaba con el _id del admin
     * como clientId: un pedido a nombre de alguien que no existe en la tabla de
     * clientes, con su stock descontado y su lote de puntos escrito.
     */
    if (!esCliente) {
      toast('Inicie sesión para terminar su pedido');
      // Vuelve a la pantalla en la que estaba, no a "/" a secas: la tienda
      // también se abre desde "/store" y desde una sección.
      navigate(`/iniciar-sesion?volver=${encodeURIComponent(rutaActual)}`);
      return;
    }
    // Con envío a domicilio la dirección es obligatoria; el servidor también
    // lo revisa, pero avisar acá evita que llene todo y falle al final.
    if (entrega === 'delivery' && !direccionElegida) {
      toast.error('Elija una dirección de entrega');
      return;
    }
    // Se compara contra totalAPagar (ya con el descuento de puntos aplicado),
    // que es lo que de verdad se va a cobrar.
    if (metodoPago === 'saldo' && saldo < totalAPagar) {
      toast.error(`Su saldo es de $${saldo.toFixed(2)} y el pedido cuesta $${totalAPagar.toFixed(2)}`);
      return;
    }

    setProcesando(true);
    try {
      await orderService.createOrder({
        clientId: user.id,
        items: items.map((i) => ({
          productId: i.id,
          name: i.nombre,
          price: precioEfectivo(i),
          amount: i.cantidad,
        })),
        paymentMethod: metodoPago,
        deliveryType: entrega,
        // Van el texto, la referencia y el punto: con las coordenadas, el
        // "cómo llegar" del repartidor cae en el portón y no a media cuadra.
        deliveryAddress: entrega === 'delivery' ? direccionElegida.direccion : undefined,
        deliveryReference: entrega === 'delivery' ? direccionElegida.referencia : undefined,
        deliveryLat: entrega === 'delivery' ? direccionElegida.lat : undefined,
        deliveryLng: entrega === 'delivery' ? direccionElegida.lng : undefined,
        channel: 'web',
        pointsToRedeem: puntosAUsar,
      });
      // Si pagó con saldo, el del servidor ya bajó: lo volvemos a leer para
      // que no se quede mostrando el de antes.
      if (metodoPago === 'saldo') recargarSaldo();
      setView('confirmation');
    } catch (error) {
      console.error(error); // el interceptor de Axios ya avisa al usuario
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmClose = () => {
    onCheckout?.();
    onCerrar();
  };

  // ── CART VIEW ──
  if (view === 'cart') {
    return (
      <Overlay $montado={montado} onClick={onCerrar}>
        <CartPanel $montado={montado} onClick={e => e.stopPropagation()}>
          <CartHeader>
            <CartTitle>
              <ShoppingBag size={18} />
              Carrito
              <ItemCount>({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</ItemCount>
            </CartTitle>
            <CloseButton onClick={onCerrar}><X size={18} /></CloseButton>
          </CartHeader>

          <CartItemsScroll>
            {items.length === 0 ? (
              <EmptyCart>
                <div className="emoji"><ShoppingBag size={44} strokeWidth={1.3} /></div>
                <div className="title">Tu carrito está vacío</div>
                <div className="sub">¡Agrega productos para comenzar!</div>
              </EmptyCart>
            ) : (
              <>
                <StoreName>
                  <StoreIcon><StoreFront size={19} strokeWidth={1.8} /></StoreIcon>
                  <StoreInfo>
                    <div className="name">{`${ajustes.nombreLinea1} ${ajustes.nombreLinea2}`.trim()}</div>
                    <div className="sub">Mejicanos, San Salvador</div>
                  </StoreInfo>
                </StoreName>

                <ProductsLabel>Productos</ProductsLabel>

                {items.map(item => (
                  <CartItemRow key={item.id}>
                    <ItemImgBox>
                      {item.imagen && !imgErrors[item.id]
                        ? <img src={item.imagen} alt={item.nombre} onError={() => setImgErrors(p => ({ ...p, [item.id]: true }))} />
                        : <span className="emoji"><Package size={26} strokeWidth={1.4} /></span>
                      }
                    </ItemImgBox>
                    <ItemInfo>
                      <ItemName>{item.nombre}</ItemName>
                      <ItemPriceLine>
                        {item.precioAnterior && <ItemOldPrice>${Number(item.precioAnterior).toFixed(2)}</ItemOldPrice>}
                        <ItemPrice>
                          ${Number(item.precio).toFixed(2)}
                          {esPorLibra(item) && <UnidadChica>/lb</UnidadChica>}
                        </ItemPrice>
                      </ItemPriceLine>
                      {/*
                        El "+" y el "−" se mueven al paso de SU unidad: de uno
                        en uno las piezas, de media en media las libras. Pedir
                        media libra de queso es lo normal en el mostrador, y
                        obligar a llevar una libra entera es cobrar de más.
                        Ver utils/unidades.js.
                      */}
                      <QtyControls>
                        <RemoveBtn onClick={() => onEliminarItem(item.id)}><Trash2 size={14} /></RemoveBtn>
                        <QtyBtn
                          onClick={() => onActualizarCantidad(item.id, ajustarCantidad(item, item.cantidad - pasoDe(item)))}
                          disabled={item.cantidad <= pasoDe(item)}
                        ><Minus size={12} /></QtyBtn>
                        <QtyNum>{cantidadConUnidad(item, item.cantidad)}</QtyNum>
                        <QtyBtn
                          onClick={() => onActualizarCantidad(item.id, ajustarCantidad(item, item.cantidad + pasoDe(item)))}
                          disabled={item.cantidad >= item.stock}
                        ><Plus size={12} /></QtyBtn>
                      </QtyControls>
                    </ItemInfo>
                    <ItemTotal>${(item.precio * item.cantidad).toFixed(2)}</ItemTotal>
                  </CartItemRow>
                ))}
              </>
            )}
          </CartItemsScroll>

          {items.length > 0 && (
            <CartFooter>
              <OrderSummaryBox>
                <SummaryTitle>Resumen de orden</SummaryTitle>
                <SummaryRow><span>Total de artículos</span><span>${subtotal.toFixed(2)}</span></SummaryRow>
                <SummaryRow><span>Costo de envío</span><span>${ENVIO.toFixed(2)}</span></SummaryRow>
                <Divider />
                <TotalRow>
                  <TotalLabel>Subtotal</TotalLabel>
                  <TotalPrice>${totalFinal.toFixed(2)}</TotalPrice>
                </TotalRow>
              </OrderSummaryBox>
              <BtnRow>
                <ClearBtn onClick={onLimpiarCarrito}>Vaciar</ClearBtn>
                <CheckoutBtn onClick={() => setView('checkout')}>
                  Checkout · ${totalFinal.toFixed(2)}
                </CheckoutBtn>
              </BtnRow>
            </CartFooter>
          )}
        </CartPanel>
      </Overlay>
    );
  }

  // ── CHECKOUT VIEW ──
  if (view === 'checkout') {
    return (
      <Overlay $montado={montado} onClick={() => {}}>
        <FullPanel $montado={montado} onClick={e => e.stopPropagation()}>
          <PageTopBar>
            <BackBtn onClick={() => setView('cart')}><ChevronLeft size={20} /></BackBtn>
            <BrandTitle>
              <BrandSub>{ajustes.nombreLinea1}</BrandSub>
              <BrandMain>{ajustes.nombreLinea2}</BrandMain>
            </BrandTitle>
            <HelpBtn><MessageCircle size={15} strokeWidth={2} /> Ayuda</HelpBtn>
          </PageTopBar>

          <CheckoutLayout>
            <CheckoutLeft>
              <CheckoutCard>
                {/* Header row */}
                <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f5f5f5' }}>
                  {/*
                    Con flexWrap la franja de la fecha se baja de renglón en vez
                    de empujar el título fuera de la tarjeta: la tarjeta recorta
                    lo que se sale, así que antes en el teléfono no se cortaba
                    la página pero sí se comía media leyenda.
                  */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <CheckoutIconBox style={{ width: 42, height: 42, marginRight: 0 }}>
                      <ShoppingBag size={20} color={BROWN} />
                    </CheckoutIconBox>
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>Checkout</div>
                    </div>
                    <DeliveryBadge>
                      <CalendarDays size={14} strokeWidth={2} /> Deliver Tomorrow, Sep 17, 8am–10am
                    </DeliveryBadge>
                  </div>
                </div>

                {/* ── Cómo lo recibe ── */}
                <div style={{ padding: '18px 20px', borderTop: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <CheckoutIconBox><MapPin size={18} color={BROWN} /></CheckoutIconBox>
                    <CheckoutSectionTitle>¿Cómo lo recibe?</CheckoutSectionTitle>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <OpcionBtn
                      type="button"
                      $activa={entrega === 'retiro'}
                      onClick={() => setEntrega('retiro')}
                    >
                      <StoreFront size={16} strokeWidth={2} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Retiro en el local</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>Sin costo de envío</div>
                      </div>
                    </OpcionBtn>

                    <OpcionBtn
                      type="button"
                      $activa={entrega === 'delivery'}
                      onClick={() => setEntrega('delivery')}
                    >
                      <MapPin size={16} strokeWidth={2} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Envío a domicilio</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>+${COSTO_ENVIO.toFixed(2)} de envío</div>
                      </div>
                    </OpcionBtn>
                  </div>

                  {/*
                    El tiempo REAL a su zona, sacado de las entregas que ya
                    hicimos por ahí. Va aquí, junto al botón de envío, porque
                    este es el momento en que la persona se pregunta "¿y en
                    cuánto me llega?" — responderlo después, en el correo de
                    confirmación, ya no le sirve para decidir.
                  */}
                  {entrega === 'delivery' && zona.hayDatos && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      marginTop: 10, padding: '10px 12px', borderRadius: 12,
                      background: '#EFFAF1', border: '1px solid #D3EEDA',
                    }}>
                      <Clock size={15} color="#14663A" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#14663A' }}>
                          {zona.texto} a {direccionElegida?.nombre || 'su dirección'}
                        </div>
                        <div style={{ fontSize: 11, color: '#3C7A55', marginTop: 1 }}>
                          {zona.respaldo}. No es una promesa: es lo que hemos tardado.
                        </div>
                      </div>
                    </div>
                  )}

                  {/*
                    Se elige entre las direcciones que ya guardó, no se escribe
                    de nuevo. Antes era una caja en blanco: el cliente marcaba
                    su casa en el mapa, la guardaba, y al pagar la tecleaba
                    otra vez — con lo cual las coordenadas nunca llegaban al
                    pedido y el repartidor salía con un texto a medias.
                  */}
                  {entrega === 'delivery' && (
                    <div style={{ marginTop: 12 }}>
                      {direcciones.length === 0 && !agregandoDireccion ? (
                        <div style={{
                          padding: '14px', border: '1px dashed #e0d3c4', borderRadius: 12,
                          background: 'var(--marca-50)', textAlign: 'center',
                        }}>
                          <p style={{ fontSize: 13, color: '#7a6a5c', margin: '0 0 10px' }}>
                            Todavía no tiene direcciones guardadas.
                          </p>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setAgregandoDireccion(true)}
                              style={{
                                padding: '9px 16px', borderRadius: 999, border: 'none',
                                background: BROWN, color: '#fff', fontSize: 13, fontWeight: 700,
                                fontFamily: 'inherit', cursor: 'pointer',
                              }}
                            >
                              Escribir mi dirección aquí
                            </button>
                            {/* El mapa queda como opción, no como peaje */}
                            <button
                              type="button"
                              onClick={irAMarcarEnElMapa}
                              style={{
                                padding: '9px 16px', borderRadius: 999,
                                border: `1.5px solid ${BROWN}`, background: '#fff',
                                color: BROWN, fontSize: 13, fontWeight: 700,
                                fontFamily: 'inherit', cursor: 'pointer',
                              }}
                            >
                              Marcarla en el mapa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {direcciones.map((dir, i) => {
                              const elegida = indiceDireccion === i;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setIndiceDireccion(i)}
                                  style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '11px 13px', borderRadius: 12, textAlign: 'left',
                                    border: `1px solid ${elegida ? BROWN : '#e5e5e5'}`,
                                    background: elegida ? 'var(--marca-50)' : '#fff',
                                  }}
                                >
                                  <MapPin size={15} color={elegida ? BROWN : '#bbb'} style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span style={{ flex: 1, minWidth: 0 }}>
                                    {dir.nombre && (
                                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2A1A0E' }}>
                                        {dir.nombre}
                                      </span>
                                    )}
                                    <span style={{ display: 'block', fontSize: 12.5, color: '#666' }}>
                                      {dir.direccion}
                                    </span>
                                    {dir.referencia && (
                                      <span style={{ display: 'block', fontSize: 11, color: '#999', marginTop: 2 }}>
                                        {dir.referencia}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {agregandoDireccion ? (
                            /*
                              Tres campos y nada más. La referencia es la que de
                              verdad usa el repartidor ("portón verde, frente a
                              la tienda"), así que se pide, pero no se obliga:
                              nadie se queda sin pedir por no saber describir su
                              cuadra.
                            */
                            <form
                              onSubmit={guardarNuevaDireccion}
                              style={{
                                marginTop: 10, padding: 12, borderRadius: 12,
                                border: '1px solid #e0d3c4', background: 'var(--marca-50)',
                                display: 'flex', flexDirection: 'column', gap: 8,
                              }}
                            >
                              <input
                                value={nuevaDireccion.nombre}
                                onChange={(e) => setNuevaDireccion((d) => ({ ...d, nombre: e.target.value }))}
                                placeholder="Nombre (Casa, Trabajo…)"
                                aria-label="Nombre de la dirección"
                                style={estiloCampoDireccion}
                              />
                              <input
                                value={nuevaDireccion.direccion}
                                onChange={(e) => setNuevaDireccion((d) => ({ ...d, direccion: e.target.value }))}
                                placeholder="Calle, número y colonia"
                                aria-label="Dirección"
                                autoFocus
                                style={estiloCampoDireccion}
                              />
                              <input
                                value={nuevaDireccion.referencia}
                                onChange={(e) => setNuevaDireccion((d) => ({ ...d, referencia: e.target.value }))}
                                placeholder="Referencia para encontrarla (opcional)"
                                aria-label="Referencia"
                                style={estiloCampoDireccion}
                              />
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type="submit"
                                  disabled={guardandoDireccion}
                                  className="press"
                                  style={{
                                    padding: '9px 18px', borderRadius: 999, border: 'none',
                                    background: BROWN, color: '#fff', fontSize: 13, fontWeight: 700,
                                    fontFamily: 'inherit', cursor: 'pointer',
                                    opacity: guardandoDireccion ? 0.6 : 1,
                                  }}
                                >
                                  {guardandoDireccion ? 'Guardando…' : 'Guardar y usarla'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAgregandoDireccion(false)}
                                  style={{
                                    background: 'none', border: 'none', padding: 0,
                                    color: '#8a7a6c', fontSize: 12.5, fontWeight: 600,
                                    fontFamily: 'inherit', cursor: 'pointer',
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={irAMarcarEnElMapa}
                                  style={{
                                    marginLeft: 'auto', background: 'none', border: 'none', padding: 0,
                                    color: BROWN, fontSize: 12, fontWeight: 700,
                                    fontFamily: 'inherit', cursor: 'pointer',
                                  }}
                                >
                                  Mejor marcarla en el mapa
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAgregandoDireccion(true)}
                              style={{
                                marginTop: 8, background: 'none', border: 'none', padding: 0,
                                color: BROWN, fontSize: 12, fontWeight: 700,
                                fontFamily: 'inherit', cursor: 'pointer',
                              }}
                            >
                              + Agregar otra dirección
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Con qué paga ── */}
                <div style={{ padding: '18px 20px', borderTop: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <CheckoutIconBox><CreditCard size={18} color={BROWN} /></CheckoutIconBox>
                    <CheckoutSectionTitle>¿Con qué paga?</CheckoutSectionTitle>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <OpcionBtn type="button" $activa={metodoPago === 'efectivo'} onClick={() => setMetodoPago('efectivo')}>
                      <Wallet size={16} strokeWidth={2} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Efectivo</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                          {entrega === 'delivery' ? 'Al recibirlo' : 'En el local'}
                        </div>
                      </div>
                    </OpcionBtn>

                    <OpcionBtn type="button" $activa={metodoPago === 'tarjeta'} onClick={() => setMetodoPago('tarjeta')}>
                      <CreditCard size={16} strokeWidth={2} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Tarjeta</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                          {entrega === 'delivery' ? 'Al recibirlo' : 'En el local'}
                        </div>
                      </div>
                    </OpcionBtn>

                    {/* Saldo: se deshabilita si no alcanza, con el motivo a la vista */}
                    <OpcionBtn
                      type="button"
                      $activa={metodoPago === 'saldo'}
                      disabled={saldo < totalAPagar}
                      title={saldo < totalAPagar ? 'Su saldo no alcanza para este pedido' : 'Pagar con su saldo'}
                      onClick={() => setMetodoPago('saldo')}
                    >
                      <Gift size={16} strokeWidth={2} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>Mi saldo</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                          ${saldo.toFixed(2)} {saldo < totalAPagar ? '· no alcanza' : 'disponible'}
                        </div>
                      </div>
                    </OpcionBtn>
                  </div>

                  {metodoPago === 'saldo' && (
                    <p style={{ fontSize: 12, color: BROWN, margin: '10px 0 0', fontWeight: 500 }}>
                      Le quedarán ${(saldo - totalAPagar).toFixed(2)} después de este pedido.
                    </p>
                  )}

                  {/*
                    Los puntos no son un método aparte sino un descuento: se
                    restan del total y el resto se paga con lo de arriba. Se
                    muestra acá porque es donde el cliente decide cómo pagar.
                  */}
                  {puedeCanjear && (
                    <label
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
                        padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                        border: `1.5px solid ${usarPuntos ? BROWN : '#e5e5e5'}`,
                        background: usarPuntos ? BROWN_LIGHT : '#fff',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={usarPuntos}
                        onChange={(e) => setUsarPuntos(e.target.checked)}
                        style={{ accentColor: BROWN, width: 16, height: 16 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: usarPuntos ? BROWN : '#444' }}>
                          Usar mis {puntosDisponibles} puntos
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {usarPuntos
                            ? `Descuenta $${descuento.toFixed(2)} de este pedido`
                            : `Equivalen a $${(Math.min(puntosDisponibles, maxPuntosUtiles) / (redeemRate || 100)).toFixed(2)} en esta compra`}
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Canjear una tarjeta sin salir del checkout */}
                  <form onSubmit={onCanjearEnCheckout} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input
                      value={codigoTarjeta}
                      onChange={(e) => setCodigoTarjeta(e.target.value.toUpperCase())}
                      placeholder="¿Tiene una tarjeta de regalo? 635-XXXX-XXXX"
                      aria-label="Código de tarjeta de regalo"
                      style={{
                        flex: 1, padding: '11px 14px', fontSize: 13, fontFamily: 'inherit',
                        border: '1px solid #e5e5e5', borderRadius: 12, outline: 'none',
                        letterSpacing: '0.05em',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={canjeando || !codigoTarjeta.trim()}
                      className="press"
                      style={{
                        padding: '0 18px', borderRadius: 12, border: `1.5px solid ${BROWN}`,
                        background: '#fff', color: BROWN, fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                        opacity: canjeando || !codigoTarjeta.trim() ? 0.5 : 1,
                      }}
                    >
                      {canjeando ? 'Canjeando…' : 'Canjear'}
                    </button>
                  </form>
                </div>

                {/* Order thumbnails */}
                <div style={{ borderTop: '1px solid #f5f5f5' }}>
                  <div style={{ padding: '14px 24px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CheckoutSectionTitle>Orden ⓘ</CheckoutSectionTitle>
                    <ChevronRight size={16} color="#aaa" />
                  </div>
                  <OrderThumbsRow>
                    {items.slice(0, 6).map(item => (
                      <OrderThumb key={item.id}>
                        {item.imagen && !imgErrors[item.id]
                          ? <img src={item.imagen} alt="" onError={() => setImgErrors(p => ({ ...p, [item.id]: true }))} />
                          : <Package size={24} strokeWidth={1.4} />
                        }
                      </OrderThumb>
                    ))}
                    {items.length > 6 && <MoreBadge>+{items.length - 6}</MoreBadge>}
                  </OrderThumbsRow>
                </div>
              </CheckoutCard>
            </CheckoutLeft>

            {/* Right summary */}
            <SummaryCard>
              <SummaryCardTitle>Resumen de orden</SummaryCardTitle>
              <SummaryCardRow><span>Costo de envío</span><span>${ENVIO.toFixed(2)}</span></SummaryCardRow>
              <SummaryCardRow><span>Tarifa de servicio</span><span>${SERVICIO.toFixed(2)}</span></SummaryCardRow>
              <SummaryCardRow><span>Total de artículos</span><span>${subtotal.toFixed(2)}</span></SummaryCardRow>
              <Divider />
              <TotalBig>
                <span>Total</span>
                <span>${totalFinal.toFixed(2)}</span>
              </TotalBig>

              {/* ── Usar puntos de fidelidad ── */}
              {puntosDisponibles > 0 && (
                <div style={{ padding: '12px 0', borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: puedeCanjear ? 'pointer' : 'not-allowed', opacity: puedeCanjear ? 1 : 0.6 }}>
                    <input
                      type="checkbox"
                      checked={usarPuntos}
                      disabled={!puedeCanjear}
                      onChange={(e) => setUsarPuntos(e.target.checked)}
                      style={{ marginTop: 3 }}
                    />
                    <span style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
                      <strong>Usar mis puntos</strong><br />
                      <span style={{ color: '#777' }}>
                        Tienes {puntosDisponibles} puntos
                        {puedeCanjear
                          ? ` = $${(puntosDisponibles / (redeemRate || 100)).toFixed(2)}`
                          : ` (necesitas ${minRedeem} para canjear)`}
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {descuento > 0 && (
                <SummaryCardRow style={{ color: '#16a34a', fontWeight: 600 }}>
                  <span>Descuento por puntos</span>
                  <span>−${descuento.toFixed(2)}</span>
                </SummaryCardRow>
              )}

              <Divider />
              <TotalBig>
                <span>Total</span>
                <span style={{ fontSize: 22 }}>${totalAPagar.toFixed(2)}</span>
              </TotalBig>

              <p style={{ fontSize: 11, color: '#aaa', marginTop: 12, lineHeight: 1.5 }}>
                Al realizar este pedido, usted acepta los Términos y Condiciones.
              </p>

              <PlaceOrderBtn onClick={handlePlaceOrder} disabled={procesando}>
                {procesando ? 'Procesando...' : 'Realizar pedido'}
              </PlaceOrderBtn>
            </SummaryCard>
          </CheckoutLayout>
        </FullPanel>
      </Overlay>
    );
  }

  // ── CONFIRMATION VIEW ──
  if (view === 'confirmation') {
    const orderDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
      <Overlay $montado={montado} onClick={() => {}}>
        <FullPanel $montado={montado}>
          <PageTopBar>
            <BackBtn onClick={handleConfirmClose}><ChevronLeft size={20} /></BackBtn>
            <BrandTitle>
              <BrandSub>{ajustes.nombreLinea1}</BrandSub>
              <BrandMain>{ajustes.nombreLinea2}</BrandMain>
            </BrandTitle>
            <HelpBtn><MessageCircle size={15} strokeWidth={2} /> Ayuda</HelpBtn>
          </PageTopBar>

          <ConfirmLayout>
            <div>
              <ConfirmCard>
                <StatusBadge><span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} /> En proceso</StatusBadge>
                <ConfirmTitle>Orden en curso</ConfirmTitle>
                <ConfirmDate>Pedido recibido el {orderDate} a. m.</ConfirmDate>

                <CheckCircle>
                  <Check size={30} color="white" strokeWidth={3} />
                </CheckCircle>
                <AcceptedMsg>Tu orden ha sido aceptada</AcceptedMsg>

                {/* Timeline */}
                <Timeline>
                  {['Recibida', 'En camino', 'Entregada'].map((step, i) => (
                    <TimelineStep key={i}>
                      <div style={{ position: 'relative' }}>
                        <TimelineDot $active={i === 0} />
                        {i < 2 && <TimelineLine $active={i === 0} />}
                      </div>
                      <TimelineLabel $active={i === 0}>
                        {orderDate.split(' ').slice(0, 2).join(' ')}
                      </TimelineLabel>
                    </TimelineStep>
                  ))}
                </Timeline>
              </ConfirmCard>

              {/* Products card */}
              <ConfirmCard>
                <PTableHeader>
                  <span>Productos</span>
                  <span>N.º Items</span>
                </PTableHeader>
                <ProductsTable>
                  {items.slice((orderPage - 1) * POR_PAGINA, orderPage * POR_PAGINA).map(item => (
                    <PTableRow key={item.id}>
                      <PImgBox>
                        {item.imagen && !imgErrors[item.id]
                          ? <img src={item.imagen} alt="" onError={() => setImgErrors(p => ({ ...p, [item.id]: true }))} />
                          : <Package size={24} strokeWidth={1.4} />
                        }
                      </PImgBox>
                      <PName>
                        {item.nombre} 1.5–2 lb
                        <div style={{ display: 'flex', gap: 6 }}>
                          <POldPrice>${item.precioAnterior ? Number(item.precioAnterior).toFixed(2) : Number(item.precio).toFixed(2)}</POldPrice>
                          <PPrice>${Number(item.precio).toFixed(2)}</PPrice>
                        </div>
                      </PName>
                      <PQty>{cantidadConUnidad(item, item.cantidad)}</PQty>
                    </PTableRow>
                  ))}
                </ProductsTable>

                {/*
                  Los números salen de cuántos productos hay, no de un "1, 2"
                  escrito a mano: antes con 3 productos la página 2 salía vacía
                  y con 12 no se podía llegar a la 3. Con una sola página no se
                  muestra nada, que es lo normal en la mayoría de compras.
                */}
                {totalPaginas > 1 && (
                  <Pagination>
                    <PageBtn
                      onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                      disabled={orderPage === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={14} />
                    </PageBtn>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                      <PageBtn key={p} $active={orderPage === p} onClick={() => setOrderPage(p)}>{p}</PageBtn>
                    ))}
                    <PageBtn
                      onClick={() => setOrderPage(p => Math.min(totalPaginas, p + 1))}
                      disabled={orderPage === totalPaginas}
                      aria-label="Página siguiente"
                    >
                      <ChevronRight size={14} />
                    </PageBtn>
                  </Pagination>
                )}
              </ConfirmCard>
            </div>

            {/* Right: summary */}
            <ConfirmSummaryCard>
              <ConfirmSummaryTitle>Resumen del pedido</ConfirmSummaryTitle>
              <OrderNumber><Hash size={14} strokeWidth={2.2} /> 123-321</OrderNumber>

              <SummaryCardRow><span>Gastos de envío</span><span>$144</span></SummaryCardRow>
              <SummaryCardRow><span>Gastos de envío</span><span>$144</span></SummaryCardRow>
              <Divider />
              <TotalBig>
                <span>Total</span>
                <span>${totalFinal.toFixed(2)}</span>
              </TotalBig>

              <PayMethod>
                <MastercardIcon />
                <span>MasterCard 02132</span>
              </PayMethod>

              <DeliveryAddress>
                <MapPin size={16} color={BROWN} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Dirección de entrega</div>
                  <div style={{ color: BROWN, fontSize: 13 }}>Shopping in 07114</div>
                </div>
              </DeliveryAddress>

              <PlaceOrderBtn style={{ marginTop: 24 }} onClick={handleConfirmClose}>
                Volver a la tienda
              </PlaceOrderBtn>
            </ConfirmSummaryCard>
          </ConfirmLayout>
        </FullPanel>
      </Overlay>
    );
  }

  return null;
};

export default ShoppingCart;