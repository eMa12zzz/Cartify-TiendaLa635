import styled, { keyframes } from 'styled-components';
import { X, Clock, Tag, ArrowRight, MapPin } from 'lucide-react';
import PromoCard from './PromoCard';
import ProductCard from './ProductCard';
import { etiquetaPromo, textoVencimiento, promoVencida } from '../../utils/promos';

/*
 * PromoDetailModal — lo que se abre al hacer click en un banner del carrusel.
 *
 * Antes el click solo filtraba la lista de abajo: la página no se movía, el
 * carrusel seguía igual y lo único que avisaba era un chip chiquito arriba.
 * Se sentía como que no había pasado nada.
 *
 * Ahora abre igual que "ver producto" —mismas curvas y duraciones que
 * ProductDetailModal— con el banner en grande, lo que se ahorra, hasta cuándo
 * dura y los productos que entran. Desde aquí se va a la tienda ya filtrada.
 */

const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  /*
   * Por debajo del detalle de producto (1000): desde aquí se puede abrir un
   * producto, y ese tiene que quedar encima, no debajo.
   */
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 24px 16px;
  animation: ${fadeIn} 0.2s var(--ease-out);
`;

const Panel = styled.div`
  background: white;
  width: 100%;
  max-width: 980px;
  border-radius: 24px;
  overflow: hidden;
  margin: auto;
  animation: ${slideUp} 0.22s var(--ease-out);
`;

const Cabecera = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px 0;
`;

const Cerrar = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #eee;
  background: #fff;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--dur-press) var(--ease-out);

  &:hover { background: #f5f5f5; }
`;

const Cuerpo = styled.div`
  padding: 16px 22px 24px;
`;

const Datos = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 6px;
`;

const Pastilla = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  background: ${p => (p.$fuerte ? BROWN : '#FAF4EE')};
  color: ${p => (p.$fuerte ? '#fff' : BROWN_DARK)};
  border: 1px solid ${p => (p.$fuerte ? BROWN : '#F0E2D4')};
`;

const Descripcion = styled.p`
  color: #666;
  font-size: 15px;
  line-height: 1.5;
  margin: 10px 0 0;
`;

/*
 * "Lo encontrás en" — el pasillo físico donde está lo de la promo.
 *
 * La 635 es una tienda de verdad: saber que el 2x1 está en Lácteos le ahorra
 * al cliente dar vueltas buscándolo. El dato ya viene con cada producto
 * (su módulo), así que aquí solo se juntan los pasillos distintos.
 */
const Ubicacion = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #FAF4EE;
  border: 1px solid #F0E2D4;
  color: ${BROWN_DARK};
  font-size: 13.5px;
  line-height: 1.4;

  strong { font-weight: 700; }
`;

const Titulo = styled.h3`
  font-size: 17px;
  font-weight: 800;
  color: #1C1614;
  margin: 26px 0 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 18px;
`;

const Vacio = styled.div`
  padding: 28px;
  text-align: center;
  color: #888;
  font-size: 14px;
  background: #F1F6F9;
  border-radius: 16px;
`;

const VerTienda = styled.button`
  margin-top: 24px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 999px;
  background: ${BROWN};
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background var(--dur-press) var(--ease-out);

  &:hover { background: ${BROWN_DARK}; }
`;

const PromoDetailModal = ({ promo, productos = [], onCerrar, onVerEnTienda, onVerProducto, onAgregarAlCarrito }) => {
  if (!promo) return null;

  const vencimiento = textoVencimiento(promo);
  const vencida = promoVencida(promo);

  /*
   * Pasillos distintos donde vive lo de la promo. Se sacan de los productos ya
   * mapeados (cada uno trae su `modulo`), así que no hace falta pedir nada más.
   * Se ordenan para que "Lácteos · Panadería" salga siempre igual y no baile.
   */
  const pasillos = [...new Set(productos.map((p) => p.modulo).filter(Boolean))].sort();

  return (
    <Overlay onClick={onCerrar}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Cabecera>
          <span style={{ fontSize: 13, fontWeight: 700, color: BROWN, letterSpacing: 0.4 }}>
            PROMOCIÓN
          </span>
          <Cerrar onClick={onCerrar} aria-label="Cerrar">
            <X size={19} strokeWidth={2.2} />
          </Cerrar>
        </Cabecera>

        <Cuerpo>
          {/* El mismo banner del carrusel, sin la flecha: ya se hizo click */}
          <PromoCard
            promo={promo}
            imagen={promo.image}
            imagenCompleta={promo.imagenCompleta}
            title={promo.title}
            descripcion={promo.promoDescription}
            etiqueta={etiquetaPromo(promo)}
            vencimiento={vencimiento}
            icono={promo.icono}
            mostrarFlecha={false}
          />

          <Datos>
            <Pastilla $fuerte>
              <Tag size={13} strokeWidth={2.4} />
              {etiquetaPromo(promo)}
            </Pastilla>
            {vencimiento && (
              <Pastilla>
                <Clock size={13} strokeWidth={2.4} />
                {vencimiento}
              </Pastilla>
            )}
            <Pastilla>
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </Pastilla>
          </Datos>

          {promo.promoDescription && <Descripcion>{promo.promoDescription}</Descripcion>}

          {pasillos.length > 0 && (
            <Ubicacion>
              <MapPin size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span>
                {pasillos.length === 1 ? 'Lo encontrás en: ' : 'Lo encontrás en los pasillos: '}
                <strong>{pasillos.join(' · ')}</strong>
              </span>
            </Ubicacion>
          )}

          <Titulo>Productos en esta promoción</Titulo>

          {productos.length === 0 ? (
            <Vacio>
              {vencida
                ? 'Esta promoción ya venció.'
                : 'Los productos de esta promoción no están disponibles en este momento.'}
            </Vacio>
          ) : (
            <Grid>
              {productos.map((producto, i) => (
                <ProductCard
                  key={producto.id}
                  className="card-in"
                  style={{ '--i': i }}
                  producto={producto}
                  onVerDetalle={onVerProducto}
                  onAgregarAlCarrito={onAgregarAlCarrito}
                />
              ))}
            </Grid>
          )}

          {productos.length > 0 && (
            <VerTienda onClick={onVerEnTienda}>
              Ver todos en la tienda
              <ArrowRight size={17} strokeWidth={2.4} />
            </VerTienda>
          )}
        </Cuerpo>
      </Panel>
    </Overlay>
  );
};

export default PromoDetailModal;
