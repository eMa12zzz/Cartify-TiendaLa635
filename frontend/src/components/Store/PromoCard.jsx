import { ArrowRight } from 'lucide-react';

/*
 * PromoCard — la cara de una promoción.
 *
 * Una sola pieza para los dos lados: el carrusel de la tienda y la vista previa
 * del admin, así lo que el empleado ve antes de guardar es lo que verá el cliente.
 *
 * REGLA IMPORTANTE (viene del diseño): el banner es una IMAGEN COMPLETA, con su
 * texto ya incluido — sea el que armó la IA en canvas o uno que diseñó la tienda.
 * Por eso NO se le encima título ni descripción: solo se le pone la flecha de
 * "entrar". Antes sí se los encimaba y el texto salía duplicado sobre el banner.
 *
 * El texto solo aparece cuando todavía NO hay imagen, para que la tarjeta no
 * quede vacía mientras se está creando la promo.
 */
const PROPORCION = '2.5 / 1'; // igual que el canvas que genera la IA (1200x480)

const PromoCard = ({ imagen, title, descripcion, etiqueta, atenuada = false, mostrarFlecha = true }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      aspectRatio: PROPORCION,
      borderRadius: 20,
      overflow: 'hidden',
      background: imagen ? '#EDE7E0' : 'linear-gradient(135deg, #8A5222, #B46C30)',
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
      /* Sin banner todavía: mostramos el texto para que se entienda qué promo es */
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4%, 34px)',
          textAlign: 'left',
        }}
      >
        {etiqueta && (
          <span
            style={{
              alignSelf: 'flex-start',
              marginBottom: 10,
              background: '#fff',
              color: '#B46C30',
              fontWeight: 800,
              fontSize: 'clamp(11px, 1.5vw, 15px)',
              padding: '5px 13px',
              borderRadius: 20,
            }}
          >
            {etiqueta}
          </span>
        )}
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(15px, 2.6vw, 27px)', lineHeight: 1.15 }}>
          {title || 'Su promoción se verá aquí'}
        </span>
        {descripcion && (
          <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(11px, 1.5vw, 15px)', marginTop: 6, lineHeight: 1.35 }}>
            {descripcion}
          </span>
        )}
      </div>
    )}

    {/* Único adorno encima del banner, como en el diseño de referencia */}
    {mostrarFlecha && (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'clamp(12px, 2.4%, 24px)',
          bottom: 'clamp(12px, 2.4%, 24px)',
          width: 'clamp(30px, 4.4%, 44px)',
          height: 'clamp(30px, 4.4%, 44px)',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.94)',
          color: '#2A1A0E',
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

export default PromoCard;
