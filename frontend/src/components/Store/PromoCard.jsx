import { ArrowRight } from 'lucide-react';
import { coloresDePromo } from '../../utils/temasPromo';

/*
 * PromoCard — la cara de una promoción.
 *
 * La tarjeta se DIBUJA con los colores del tema elegido y el texto de la promo.
 * Antes esto era una imagen que armaba la IA en canvas y se subía a Cloudinary;
 * el problema es que quedaba congelada: cambiar una palabra obligaba a
 * regenerar y volver a subir, y el texto se veía borroso al escalarse.
 *
 * Si la tienda sube su propio banner diseñado, ESE manda y se muestra solo la
 * imagen — sin texto encima, para no duplicar lo que la imagen ya trae.
 *
 * Una sola pieza para los dos lados: el carrusel del cliente y la vista previa
 * del admin, así lo que se ve antes de guardar es lo que verá la gente.
 */
const PROPORCION = '2.5 / 1';

const PromoCard = ({ promo, imagen, title, descripcion, etiqueta, atenuada = false, mostrarFlecha = true }) => {
  const colores = coloresDePromo(promo);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: PROPORCION,
        borderRadius: 20,
        overflow: 'hidden',
        background: imagen ? '#EDE7E0' : colores.fondo,
        boxShadow: atenuada ? '0 8px 24px rgba(0,0,0,0.16)' : '0 16px 40px rgba(140,86,40,0.28)',
      }}
    >
      {imagen ? (
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
          {etiqueta && (
            <span
              style={{
                alignSelf: 'flex-start',
                marginBottom: 10,
                background: colores.acento,
                color: colores.fondo.startsWith('linear') ? colores.texto === '#FFFFFF' ? '#3D2B1A' : colores.texto : colores.texto,
                fontWeight: 800,
                fontSize: 'clamp(11px, 1.6vw, 16px)',
                padding: '5px 14px',
                borderRadius: 999,
                letterSpacing: 0.3,
              }}
            >
              {etiqueta}
            </span>
          )}

          <span
            style={{
              color: colores.texto,
              fontWeight: 800,
              fontSize: 'clamp(16px, 2.9vw, 32px)',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
            }}
          >
            {title || 'Su promoción se verá aquí'}
          </span>

          {descripcion && (
            <span
              style={{
                color: colores.texto,
                opacity: 0.85,
                fontSize: 'clamp(11px, 1.6vw, 16px)',
                marginTop: 6,
                lineHeight: 1.35,
                maxWidth: '78%',
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
            background: imagen ? 'rgba(255,255,255,0.94)' : colores.acento,
            color: imagen ? '#2A1A0E' : (colores.texto === '#FFFFFF' ? '#3D2B1A' : colores.texto),
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
