import { motion, useReducedMotion } from 'framer-motion';
import { usePromoCarousel, useCabenTres } from '../../hooks/usePromoCarousel';
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
 * Dos maneras de mostrar lo mismo, según el espacio que haya.
 *
 * ANILLO (teléfono): la del centro de frente y las otras giradas detrás, como
 * los discos de una rocola. Tres tarjetas legibles no caben en 400 px.
 *
 * FILA (pantalla ancha): las tres de frente, una al lado de otra. Son solo
 * tres promociones y todas valen igual; esconder dos detrás de un giro era
 * regalar espacio y obligar a esperar a que el carrusel diera la vuelta.
 */
/*
 * El ancho de las tarjetas en fila y la proporción que usa PromoCard.
 * Van juntos a propósito: el alto del carrusel sale de dividir uno entre
 * otro, así no hay manera de que se desincronicen y corten la tarjeta.
 */
const ANCHO_FILA = 'clamp(285px, 29vw, 430px)';
const PROPORCION_PROMO = 2.2;

const ANILLO = {
  VISIBLES: 1,        // tarjetas a cada lado
  SEPARACION: 46,     // % de ancho que se corre cada paso
  GIRO: 42,           // grados de rotación en Y
  PROFUNDIDAD: 180,   // px que se alejan del ojo (esto las manda atrás)
  ENCOGE: 0.08,
  APAGA: 0.35,
  ancho: 'clamp(260px, 58vw, 600px)',
  margen: 'clamp(-300px, -29vw, -130px)',
};

const FILA = {
  /*
   * Una fila plana que se desliza, no un anillo que gira.
   *
   * Sin 3D: todas las tarjetas miden lo mismo, están a la misma altura y
   * separadas por la misma distancia. Las que vienen entran POR EL COSTADO,
   * como una cinta que corre — antes se achicaban y se apagaban, y eso el
   * ojo lo lee como "están al fondo", que era justo lo confuso.
   *
   * VISIBLES llega a 3 para que las de más allá alcancen a asomarse por la
   * orilla: sin eso el carrusel parecía tener solo tres promos y nadie
   * tocaba la flecha.
   */
  VISIBLES: 3,
  /*
   * La MISMA distancia entre todas, con aire entre una y otra. A 100% quedan
   * pegadas y las tres se leen como un solo bloque de color; el 107% deja el
   * respiro justo para que cada promoción se vea como una pieza aparte.
   */
  SEPARACION: 107,
  ENCOGE: 0,          // todas del mismo tamaño
  APAGA: 0,           // y con la misma fuerza de color

  /*
   * Un toque de 3D, no una rocola.
   *
   * La del centro va derecha y las de los lados apenas se inclinan hacia
   * adentro. Siete grados no se notan como "giro": se notan como que la fila
   * tiene volumen y sigue más allá de la pantalla. Las de la orilla se
   * inclinan un poco más para reforzar que vienen entrando.
   */
  GIRO: 7,
  GIRO_ORILLA: 14,
  PROFUNDIDAD: 45,    // apenas se van hacia atrás, para acompañar el giro

  /*
   * Lo único que distingue a las que vienen es un desenfoque suave: dice
   * "esta todavía no te toca" sin sacarla de la fila ni mandarla al fondo.
   */
  BORROSO: 3,


  /*
   * El ancho está atado a que quepa el asomo: con tres tarjetas más grandes
   * que esto, las de la orilla caen fuera de la pantalla y el carrusel vuelve
   * a parecer que tiene solo tres promociones.
   */
  /*
   * El ancho sale de una cuenta, no del gusto: tres tarjetas separadas al
   * 107% ocupan ~3.14 veces su ancho, y a 29vw eso es el 91% de la pantalla.
   * El 9% que sobra es por donde asoman las que vienen. Más anchas y ese
   * asomo desaparece — se probó a 31vw y las de la orilla terminaban
   * escondidas detrás de las del frente.
   *
   * Por eso las tarjetas crecieron de alto (PromoCard pasó a 2.2:1) en vez
   * de a lo ancho: el alto no se lo quita a nadie.
   */
  ancho: ANCHO_FILA,
  margen: 'clamp(-215px, -14.5vw, -142px)',
  /*
   * El alto se DERIVA del ancho y de la proporción de la tarjeta, no se
   * escribe a mano. Escrito a mano se desincronizó al cambiar la proporción
   * de PromoCard y el carrusel empezó a cortar las promociones por abajo:
   * la tarjeta medía más de lo que el contenedor recortaba.
   */
  alto: `calc(${ANCHO_FILA} / ${PROPORCION_PROMO})`,
};

/*
 * Los primeros y últimos centímetros se van difuminando hasta transparente.
 * El 7% deja pasar el asomo de las tarjetas que vienen sin que ninguna se
 * corte a filo contra el borde.
 */
const DEGRADADO_ORILLAS =
  'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)';

const PromoBanners = ({ onSelectPromo }) => {
  const reducirMovimiento = useReducedMotion();
  const cabenTres = useCabenTres();
  const { promos, activa, total, irA, siguiente, anterior, distancia, pausar, reanudar } =
    usePromoCarousel({ autoplay: !reducirMovimiento });

  if (total === 0) return null;

  const unaSola = total === 1;
  // La fila solo tiene sentido si de verdad hay más de una que poner al lado.
  const enFila = cabenTres && total > 1;
  const L = enFila ? FILA : ANILLO;

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
          /*
           * Alto de la tarjeta MÁS un respiro, sobre todo abajo.
           *
           * El carrusel recorta lo que se sale (tiene que hacerlo, para que
           * las de la orilla se corten contra el borde de la pantalla), y la
           * sombra de las tarjetas cae unos 40 px hacia abajo: sin este aire
           * se cortaba a filo y se veía una raya gris bajo las promociones.
           * También deja lugar a que crezcan con el cursor.
           */
          height: enFila ? `calc(${FILA.alto} + 52px)` : 'clamp(120px, 25vw, 256px)',
          /*
           * La perspectiva es lo que hace que las del fondo se vean atrás y
           * no solo más chicas. Con una sola promo no hay fondo que mostrar.
           * En fila se abre más el lente (1600) que en el anillo: con las
           * tarjetas casi de frente, una perspectiva corta las deformaría.
           */
          perspective: unaSola ? 'none' : enFila ? 1600 : 1250,
          transformStyle: 'preserve-3d',
          /*
           * El degradado de las orillas.
           *
           * Es lo que arregla que las que vienen se vieran "por detrás": en
           * vez de cortarse a filo contra el borde de la pantalla —que es lo
           * que las hacía parecer mal dibujadas— se desvanecen. Junto con el
           * desenfoque, la orilla se lee como "esto sigue", no como un
           * pedazo de tarjeta mal puesto.
           *
           * Solo en fila: en el anillo las laterales ya se van hacia atrás y
           * un degradado encima solo las apagaría.
           */
          ...(enFila && {
            maskImage: DEGRADADO_ORILLAS,
            WebkitMaskImage: DEGRADADO_ORILLAS,
          }),
        }}
      >
        {promos.map((promo, i) => {
          const d = distancia(i);
          const ad = Math.abs(d);
          const lejos = ad > L.VISIBLES;
          const esCentro = d === 0;

          /*
           * En fila hay dos planos: las tres del frente (|d| ≤ 1), derechas y
           * legibles, y las de la orilla (|d| ≥ 2), que se asoman borrosas
           * por los lados.
           *
           * La cuenta de las de la orilla no puede ser la misma
           * multiplicación de siempre: a 101% por paso, la cuarta caería
           * fuera de la pantalla en vez de asomarse. Por eso se corren menos.
           */
          const enOrilla = enFila && ad >= 2;

          /*
           * En fila, la MISMA distancia entre todas: es lo que hace que se
           * lean como una cinta que corre de lado. Acercar las de la orilla
           * se probó y quedaban DETRÁS de las del frente en vez de al lado,
           * que es justo lo que se veía mal.
           */
          const x = d * L.SEPARACION;

          /*
           * El giro y la profundidad son leves y a propósito: dan volumen
           * sin mandar nada al fondo. Las de la orilla se inclinan un punto
           * más para que se lean como "vienen entrando por el lado".
           */
          const z = -ad * L.PROFUNDIDAD;

          /*
           * El giro va al revés que en el anillo: las laterales abren su cara
           * HACIA el centro en vez de esconderla. Así las tres se leen de
           * frente y el volumen se siente como un abanico que se abre, no
           * como tarjetas dándose la vuelta.
           */
          const giro = enOrilla
            ? Math.sign(d) * L.GIRO_ORILLA
            : d * L.GIRO;
          const escala = Math.max(0.6, 1 - ad * L.ENCOGE);
          const opacidad = lejos ? 0 : 1 - ad * L.APAGA;

          // El desenfoque crece con la distancia: la de más allá se lee como
          // "y todavía hay otra".
          const desenfoque = enOrilla ? L.BORROSO * (ad - 1) : 0;

          return (
            <motion.button
              key={promo._id}
              type="button"
              aria-hidden={lejos}
              tabIndex={lejos ? -1 : 0}
              /*
               * En fila las tres están de frente y se leen igual, así que
               * tocar cualquiera abre sus productos. En el anillo, tocar una
               * lateral primero la trae al centro: está girada y a medias, y
               * abrir algo que no se alcanza a leer se siente a trampa.
               */
              onClick={() => ((enFila && !enOrilla) || esCentro ? onSelectPromo(promo) : irA(i))}
              title={(enFila && !enOrilla) || esCentro ? 'Ver los productos de esta promoción' : 'Ver esta promoción'}
              animate={{
                x: `${x}%`,
                /*
                 * z (translateZ) es lo que arregla que las laterales taparan a
                 * la del centro. En un escenario con perspective + preserve-3d
                 * el navegador ordena por posición 3D REAL y el z-index queda
                 * de adorno; como las laterales giran sobre su propio eje, su
                 * borde cercano se venía hacia el ojo y se dibujaba encima.
                 * Empujándolas hacia atrás, la del centro queda siempre al frente.
                 */
                z: reducirMovimiento ? 0 : z,
                rotateY: reducirMovimiento ? 0 : giro,
                scale: escala,
                opacity: opacidad,
                filter: `blur(${desenfoque}px)`,
                zIndex: 10 - ad,
              }}
              /*
               * Al pasar el cursor la tarjeta crece un poquito: es la señal
               * de que se puede tocar. Solo en las que de verdad se pueden
               * abrir — agrandar una borrosa de la orilla prometería algo
               * que ese clic no hace.
               */
              whileHover={
                reducirMovimiento || (enFila && enOrilla)
                  ? undefined
                  : { scale: escala * 1.035 }
              }
              transition={{ duration: reducirMovimiento ? 0.2 : 0.55, ease: EASE_OUT }}
              style={{
                position: 'absolute',
                // Arriba del respiro: el aire que sobra va abajo, que es
                // hacia donde cae la sombra.
                top: enFila ? 10 : 0,
                left: '50%',
                width: L.ancho,
                marginLeft: L.margen,
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
                atenuada={enOrilla || (!enFila && !esCentro)}
                mostrarFlecha={(enFila && !enOrilla) || esCentro}
              />
            </motion.button>
          );
        })}
      </div>

      {/*
        Controles: solo tienen sentido si hay más de una promo. En fila se
        suben con margen negativo, porque el aire de abajo del carrusel es
        para que quepa la sombra, no para separar los botones.
      */}
      {!unaSola && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: enFila ? -20 : 14 }}>
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
