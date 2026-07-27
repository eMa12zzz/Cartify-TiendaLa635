import { motion, useReducedMotion } from 'framer-motion';
import { usePromoCarousel } from '../../hooks/usePromoCarousel';
import { etiquetaPromo, textoVencimiento } from '../../utils/promos';
import { EASE_OUT } from '../../utils/motion';
import PromoCard from './PromoCard';

/*
 * PromoBanners — carrusel 3D de las promociones anunciadas.
 *
 * Las tarjetas viven en un anillo: la del centro se ve de frente y las de los
 * lados giran hacia adentro, como los discos de una rocola. Click al centro
 * filtra la tienda a esa promo; click a un lado la trae al frente.
 *
 * Toda la lógica está en usePromoCarousel; aquí solo se pinta.
 */

/*
 * Cuánto se mueve, gira y se achica cada tarjeta según su distancia al centro.
 * Se ve UNA a cada lado: con dos por lado las de los extremos se salían del
 * ancho y las vecinas se leían enteras, compitiendo con la del centro.
 * La idea es que las laterales se asomen por detrás, no que acompañen.
 */
const VISIBLES = 1;       // tarjetas a cada lado
const SEPARACION = 46;    // % de ancho que se corre cada paso
const GIRO = 42;          // grados de rotación en Y
const PROFUNDIDAD = 180;  // px que se alejan del ojo por paso (esto las manda atrás)
const ENCOGE = 0.08;      // achique extra; la profundidad ya achica sola
const APAGA = 0.35;       // cuánta opacidad pierde por paso

const PromoBanners = ({ onSelectPromo }) => {
  const reducirMovimiento = useReducedMotion();
  const { promos, activa, total, irA, siguiente, anterior, distancia, pausar, reanudar } =
    usePromoCarousel({ autoplay: !reducirMovimiento });

  if (total === 0) return null;

  const unaSola = total === 1;

  return (
    <section
      aria-label="Promociones de la tienda"
      onMouseEnter={pausar}
      onMouseLeave={reanudar}
      onFocus={pausar}
      onBlur={reanudar}
      style={{ padding: '22px 0 6px', overflow: 'hidden' }}
    >
      {/* Escenario 3D. La perspectiva es lo que da la sensación de profundidad. */}
      <div
        style={{
          position: 'relative',
          // Alto = ancho / 2.5 + aire para que no se corte la sombra.
          height: 'clamp(120px, 25vw, 256px)',
          perspective: unaSola ? 'none' : 1250,
          transformStyle: 'preserve-3d',
        }}
      >
        {promos.map((promo, i) => {
          const d = distancia(i);
          const lejos = Math.abs(d) > VISIBLES;
          const esCentro = d === 0;

          return (
            <motion.button
              key={promo._id}
              type="button"
              aria-hidden={lejos}
              tabIndex={lejos ? -1 : 0}
              onClick={() => (esCentro ? onSelectPromo(promo) : irA(i))}
              title={esCentro ? 'Ver los productos de esta promoción' : 'Ver esta promoción'}
              animate={{
                x: `${d * SEPARACION}%`,
                /*
                 * z (translateZ) es lo que arregla que las laterales taparan a
                 * la del centro. En un escenario con perspective + preserve-3d
                 * el navegador ordena por posición 3D REAL y el z-index queda
                 * de adorno; como las laterales giran sobre su propio eje, su
                 * borde cercano se venía hacia el ojo y se dibujaba encima.
                 * Empujándolas hacia atrás, la del centro queda siempre al frente.
                 */
                z: reducirMovimiento ? 0 : -Math.abs(d) * PROFUNDIDAD,
                rotateY: reducirMovimiento ? 0 : -d * GIRO,
                scale: Math.max(0.6, 1 - Math.abs(d) * ENCOGE),
                opacity: lejos ? 0 : 1 - Math.abs(d) * APAGA,
                zIndex: 10 - Math.abs(d),
              }}
              transition={{ duration: reducirMovimiento ? 0.2 : 0.55, ease: EASE_OUT }}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 'clamp(260px, 58vw, 600px)',
                marginLeft: 'clamp(-300px, -29vw, -130px)',
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                transformStyle: 'preserve-3d',
                pointerEvents: lejos ? 'none' : 'auto',
              }}
            >
              <PromoCard
                promo={promo}
                imagen={promo.image}
                imagenCompleta={promo.imagenCompleta}
                title={promo.title}
                descripcion={promo.promoDescription}
                etiqueta={etiquetaPromo(promo)}
                vencimiento={textoVencimiento(promo)}
                icono={promo.icono}
                atenuada={!esCentro}
                mostrarFlecha={esCentro}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Controles: solo tienen sentido si hay más de una promo */}
      {!unaSola && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
          <button
            onClick={anterior}
            aria-label="Promoción anterior"
            className="press"
            style={flecha}
          >‹</button>

          <div style={{ display: 'flex', gap: 7 }}>
            {promos.map((promo, i) => (
              <button
                key={promo._id}
                onClick={() => irA(i)}
                aria-label={`Ir a la promoción ${i + 1}`}
                aria-current={i === activa}
                style={{
                  width: i === activa ? 22 : 8,
                  height: 8,
                  padding: 0,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === activa ? '#9C6026' : '#D9C7B4',
                  transition: 'width var(--dur-dropdown, 0.2s) var(--ease-out), background var(--dur-dropdown, 0.2s)',
                }}
              />
            ))}
          </div>

          <button
            onClick={siguiente}
            aria-label="Siguiente promoción"
            className="press"
            style={flecha}
          >›</button>
        </div>
      )}
    </section>
  );
};

const flecha = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '1px solid #E4D5C3',
  background: '#fff',
  color: '#9C6026',
  fontSize: 20,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default PromoBanners;
