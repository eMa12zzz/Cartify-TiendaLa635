import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { duiEsValido, MENSAJE_DUI_INVALIDO } from '../../utils/validaciones';
import { formatearDui, LARGO_DUI } from '../../utils/mascaras';
import { EDAD_MINIMA } from '../../utils/edad';

/*
 * ModalConfirmarEdad — el candado de los productos +18.
 *
 * Pide el DUI, no la fecha de nacimiento: en El Salvador el DUI se emite a los
 * 18, así que un DUI bien formado ya afirma la mayoría de edad. Sigue siendo
 * una barrera blanda (no se puede comprobar que el documento sea suyo), por eso
 * la verificación de verdad es el DUI FÍSICO en la entrega, y así se dice.
 */
const ModalConfirmarEdad = ({ abierto, onCerrar, onConfirmar }) => {
  const [dui, setDui] = useState('');
  const [error, setError] = useState('');

  if (!abierto) return null;

  const enviar = (e) => {
    e.preventDefault();
    const d = dui.replace(/\D/g, '');
    if (!d.length) { setError('Ingresá tu número de DUI.'); return; }
    if (d.length < 9) { setError('El DUI lleva 9 dígitos (12345678-9).'); return; }
    if (!duiEsValido(dui)) { setError(MENSAJE_DUI_INVALIDO); return; }
    setError('');
    setDui('');
    onConfirmar(formatearDui(dui));
  };

  const cerrar = () => { setError(''); onCerrar(); };

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: 420,
          borderRadius: 20, overflow: 'hidden', position: 'relative',
        }}
      >
        <button
          type="button" onClick={cerrar} aria-label="Cerrar"
          style={{
            position: 'absolute', top: 12, right: 12, width: 34, height: 34,
            borderRadius: '50%', border: '1px solid #eee', background: '#fff',
            color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '28px 24px 24px' }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14, marginBottom: 16,
              background: 'var(--marca-100)', color: 'var(--marca-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ShieldAlert size={26} />
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, color: '#2A1A0E' }}>
            Producto para mayores de {EDAD_MINIMA}
          </h3>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            Ingresá tu número de DUI para verlo. Al recibir el pedido se te pedirá el documento
            físico; sin él, este producto no se puede entregar.
          </p>

          <form onSubmit={enviar}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 6 }}>
              DUI
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={LARGO_DUI}
              value={dui}
              placeholder="00000000-0"
              onChange={(e) => { setDui(formatearDui(e.target.value)); setError(''); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${error ? '#ef4444' : '#e0e0e0'}`,
                fontSize: 15, color: '#111', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.5px',
              }}
            />
            {error && (
              <p style={{ color: '#dc2626', fontSize: 13, margin: '10px 0 0' }}>{error}</p>
            )}

            <button
              type="submit"
              style={{
                width: '100%', marginTop: 18, padding: 13, border: 'none', borderRadius: 10,
                background: 'var(--marca-600)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Confirmar
            </button>
          </form>

          <p style={{ margin: '14px 0 0', fontSize: 11.5, color: '#9a938c', lineHeight: 1.45 }}>
            Solo se usa para habilitar la compra de productos restringidos. No se comparte.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmarEdad;
