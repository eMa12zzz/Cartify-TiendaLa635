import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

/*
 * ============================================================
 * AVISO DE "AGREGADO AL CARRITO" — avisoCarrito.jsx
 * ============================================================
 * La píldora oscura con el check verde, abajo al centro: la misma de la
 * landing page.
 *
 * Por qué abajo y no en la esquina de los demás avisos: se dispara decenas de
 * veces por compra, y arriba a la derecha tapaba justo el botón del carrito
 * al que la foto va volando. Abajo al centro queda cerca del pulgar en el
 * teléfono y no le estorba a nada.
 *
 * Usa siempre el MISMO id: tocar "+" cinco veces actualiza la píldora que ya
 * está en pantalla ("3 en el carrito", "4 en el carrito"...) en vez de apilar
 * cinco avisos.
 *
 * La entrada y la salida (rebote desde abajo, hundirse al irse) están en
 * index.css: .aviso-carrito-entra / .aviso-carrito-sale.
 * ============================================================
 */

const ID = 'carrito-agregado';

export const avisarAgregado = (texto) =>
  toast.custom(
    (t) => (
      <div
        role="status"
        aria-live="polite"
        className={t.visible ? 'aviso-carrito-entra' : 'aviso-carrito-sale'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px 10px 10px',
          borderRadius: 999,
          background: 'var(--tinta, #1C1614)',
          color: 'var(--sobre-tinta, #fff)',
          fontSize: 14,
          fontWeight: 500,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
          maxWidth: 'min(92vw, 420px)',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#16A34A',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            flex: 'none',
          }}
        >
          <Check size={15} strokeWidth={3} />
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texto}</span>
      </div>
    ),
    { id: ID, position: 'bottom-center', duration: 2200 }
  );

export default avisarAgregado;
