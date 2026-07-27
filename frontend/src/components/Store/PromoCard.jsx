import { ArrowRight, Clock } from 'lucide-react';
import { coloresDePromo } from '../../utils/temasPromo';
import { iconoDePromo } from '../../utils/iconosPromo';

/*
 * PromoCard — la cara de una promoción.
 *
 * La tarjeta se DIBUJA con los colores del tema elegido y el texto de la promo.
 * Antes esto era una imagen que armaba la IA en canvas y se subía a Cloudinary;
 * el problema es que quedaba congelada: cambiar una palabra obligaba a
 * regenerar y volver a subir, y el texto se veía borroso al escalarse.
 *
 * Si la tienda sube una foto, esta ACOMPAÑA: se acomoda a la derecha y se
 * difumina hacia el color del fondo, con el texto siempre legible a la
 * izquierda. Antes la imagen reemplazaba la tarjeta entera y se tragaba el
 * título, el precio y la fecha — subir una foto de producto costaba perder
 * todo lo que la promo tenía que decir.
 *
 * Para quien sí diseñó su banner completo (1200 × 480) está `imagenCompleta`,
 * que devuelve el comportamiento de imagen a sangre. Es una decisión, no un
 * accidente.
 *
 * Una sola pieza para los dos lados: el carrusel del cliente y la vista previa
 * del admin, así lo que se ve antes de guardar es lo que verá la gente.
 */
const PROPORCION = '2.5 / 1';

// Cuánto ocupa la foto cuando acompaña al texto.
const ANCHO_IMAGEN = '46%';

/*
 * A partir de acá el título ya no deja espacio para la marca de agua. Es un
 * corte a ojo, pero deliberado: preferimos perder el adorno antes que dejar
 * que un icono gigante compita con lo que la promo tiene que decir.
 */
const TITULO_LARGO = 42;
const DESCRIPCION_LARGA = 80;

const PromoCard = ({
  promo,
  imagen,
  title,
  descripcion,
  etiqueta,
  vencimiento,
  icono,
  imagenCompleta = false,
  atenuada = false,
  mostrarFlecha = true,
}) => {
  const colores = coloresDePromo(promo);
  const aSangre = imagen && imagenCompleta;      // la foto manda sola
  const acompaña = imagen && !imagenCompleta;    // la foto acompaña al texto

  // Sobre fondos oscuros el texto es blanco; el acento entonces necesita
  // letra oscura para que se lea (y al revés en el tema claro).
  const textoSobreAcento = colores.texto === '#FFFFFF' ? '#3D2B1A' : colores.texto;

  const Icono = iconoDePromo(icono);
  /*
   * La marca de agua ocupa el lado derecho, así que solo cabe si ese lado
   * está libre: sin foto y con un texto que no se estire hasta allá.
   */
  const textoLargo = (title || '').length > TITULO_LARGO || (descripcion || '').length > DESCRIPCION_LARGA;
  const marcaDeAgua = Icono && !imagen && !textoLargo;
  const textoAngosto = acompaña || marcaDeAgua;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: PROPORCION,
        borderRadius: 20,
        overflow: 'hidden',
        background: aSangre ? '#EDE7E0' : colores.fondo,
        boxShadow: atenuada ? '0 8px 24px rgba(0,0,0,0.16)' : '0 16px 40px rgba(140,86,40,0.28)',
        /*
         * La letra se mide contra el ancho de ESTA tarjeta (cqw), no contra el
         * de la ventana. Con vw la misma tarjeta se veía bien en la tienda
         * —donde es ancha— y se desbordaba en la grilla del admin, que la
         * pinta a un tercio del tamaño: el título tapaba la etiqueta y la
         * descripción se salía por abajo.
         */
        containerType: 'inline-size',
      }}
    >
      {/*
        La foto que acompaña se enmascara con un degradado hacia la izquierda:
        así se funde con el fondo sea cual sea el tema (que muchas veces ES un
        degradado, y no se puede repetir a mano encima de la imagen).
      */}
      {acompaña && (
        <img
          src={imagen}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: ANCHO_IMAGEN,
            height: '100%',
            objectFit: 'cover',
            maskImage: 'linear-gradient(to right, transparent 0%, #000 46%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 46%)',
          }}
        />
      )}

      {/*
        Marca de agua: el icono en grande, apenas visible, llenando el vacío
        de la derecha. Va antes del texto en el DOM para quedar por detrás.
      */}
      {marcaDeAgua && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            /* El tamaño va en el contenedor: el atributo del SVG no entiende cqw */
            width: '31cqw',
            height: '31cqw',
            color: colores.acento,
            opacity: 0.17,
            lineHeight: 0,
            pointerEvents: 'none',
          }}
        >
          <Icono size="100%" strokeWidth={1.6} />
        </span>
      )}

      {aSangre ? (
        <img
          src={imagen}
          alt={title || descripcion || 'Promoción'}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(16px, 4.5%, 40px)',
            textAlign: 'left',
          }}
        >
          {(etiqueta || vencimiento) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {etiqueta && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: colores.acento,
                    color: colores.fondo.startsWith('linear') ? textoSobreAcento : colores.texto,
                    fontWeight: 800,
                    fontSize: 'clamp(10px, 3cqw, 16px)',
                    padding: '4px 12px',
                    borderRadius: 999,
                    letterSpacing: 0.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* El mismo icono, en chiquito: acompaña al ahorro */}
                  {Icono && <Icono size="1em" strokeWidth={2.6} />}
                  {etiqueta}
                </span>
              )}

              {/* La urgencia va junto al ahorro: es la mitad del argumento */}
              {vencimiento && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    border: `1px solid ${colores.acento}`,
                    color: colores.texto,
                    opacity: 0.92,
                    fontWeight: 600,
                    fontSize: 'clamp(9px, 2.4cqw, 13px)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Clock size={12} strokeWidth={2.4} />
                  {vencimiento}
                </span>
              )}
            </div>
          )}

          <span
            style={{
              color: colores.texto,
              fontWeight: 800,
              fontSize: 'clamp(14px, 6cqw, 32px)',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              maxWidth: textoAngosto ? '62%' : '100%',
              /*
               * Tope de dos líneas: un título largo empujaba la descripción
               * fuera de la tarjeta en vez de cortarse.
               */
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title || 'Su promoción se verá aquí'}
          </span>

          {descripcion && (
            <span
              style={{
                color: colores.texto,
                opacity: 0.85,
                fontSize: 'clamp(9px, 3cqw, 16px)',
                marginTop: 6,
                lineHeight: 1.35,
                maxWidth: textoAngosto ? '58%' : '78%',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {descripcion}
            </span>
          )}
        </div>
      )}

      {mostrarFlecha && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 'clamp(12px, 2.4%, 24px)',
            bottom: 'clamp(12px, 2.4%, 24px)',
            width: 'clamp(30px, 4.4%, 44px)',
            height: 'clamp(30px, 4.4%, 44px)',
            borderRadius: '50%',
            background: aSangre ? 'rgba(255,255,255,0.94)' : colores.flecha,
            color: aSangre ? '#2A1A0E' : textoSobreAcento,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(0,0,0,0.18)',
          }}
        >
          <ArrowRight size={18} strokeWidth={2.4} />
        </span>
      )}
    </div>
  );
};

export default PromoCard;
