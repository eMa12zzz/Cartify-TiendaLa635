import { useState, useEffect } from 'react';
import { promotionService } from '../../api/promotionService';

/*
 * PromoBanners — carrusel de banners de promociones activas en la tienda.
 * Al hacer click en uno, avisa al padre (onSelectPromo) para que la tienda
 * filtre a los productos de esa promo.
 */
const PromoBanners = ({ onSelectPromo }) => {
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    promotionService.getPromotions()
      .then((d) => setPromos((Array.isArray(d) ? d : []).filter((p) => p.isActive !== false && p.image)))
      .catch(() => {});
  }, []);

  if (promos.length === 0) return null;

  return (
    <div style={{ padding: '16px 28px 0' }}>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
        {promos.map((promo) => (
          <button
            key={promo._id}
            onClick={() => onSelectPromo(promo)}
            title="Ver productos de esta promoción"
            style={{
              position: 'relative', flex: '0 0 auto', width: 380, height: 150,
              borderRadius: 16, overflow: 'hidden', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <img src={promo.image} alt={promo.promoDescription} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.05))',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16, textAlign: 'left',
            }}>
              {promo.title && <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{promo.title}</span>}
              <span style={{ color: '#fff', fontSize: 13, opacity: 0.92 }}>{promo.promoDescription}</span>
              <span style={{ marginTop: 6, alignSelf: 'flex-start', background: '#B47C4D', color: '#fff', fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>
                -{promo.discount}% · Ver productos
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromoBanners;
