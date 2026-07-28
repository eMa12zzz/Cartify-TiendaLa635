import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChefHat, Bike, Check, X, ChevronRight } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * BURBUJA DE PEDIDO — el seguimiento sin salir de la tienda
 * ============================================================
 * Mientras un pedido no esté entregado, el cliente lo ve flotando en la
 * esquina. Antes había que entrar a Mi Cuenta → Mis pedidos para saber si ya
 * lo estaban preparando, y nadie hace eso: se quedaban mirando el teléfono
 * sin señal de que algo estuviera pasando.
 *
 * Va abajo a la IZQUIERDA porque el botón de WhatsApp ya ocupa la derecha.
 * Dos burbujas en la misma esquina se tapan entre ellas.
 * ============================================================
 */

const PASOS = [
  { id: 'pagado', label: 'Recibido', detalle: 'Su pedido entró a la tienda', Icono: Package },
  { id: 'preparando', label: 'Preparando', detalle: 'Están juntando sus productos', Icono: ChefHat },
  { id: 'entregado', label: 'Entregado', detalle: '¡Que lo disfrute!', Icono: Check },
];

const BROWN = '#B46C30';

const BurbujaPedido = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useMyOrders();
  const [abierta, setAbierta] = useState(false);
  const [cerradaPor, setCerradaPor] = useState(null);

  // Solo los clientes tienen pedidos que seguir.
  if (user?.type !== 'client') return null;

  /*
   * El pedido en curso: el más reciente que todavía no se entregó ni se
   * canceló. Si tiene varios, se sigue el último — es el que acaba de hacer.
   */
  const enCurso = (orders || [])
    .filter((o) => ['pagado', 'preparando'].includes(o.status))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

  if (!enCurso || cerradaPor === enCurso._id) return null;

  const pasoActual = PASOS.findIndex((p) => p.id === enCurso.status);
  const paso = PASOS[pasoActual] || PASOS[0];
  const esDomicilio = enCurso.deliveryType === 'delivery';

  return (
    <div
      style={{
        position: 'fixed',
        left: 'max(20px, env(safe-area-inset-left))',
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      {abierta && (
        <div
          style={{
            width: 'min(300px, calc(100vw - 40px))',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
            border: '1px solid #F0E7DE',
            overflow: 'hidden',
            animation: 'cardIn 220ms var(--ease-out)',
          }}
        >
          <div style={{ background: BROWN, color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              Pedido #{String(enCurso._id).slice(-6).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => setCerradaPor(enCurso._id)}
              aria-label="Ocultar el seguimiento"
              style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 14 }}>
            {/* Los pasos, con el actual resaltado */}
            {PASOS.map((p, i) => {
              const hecho = i < pasoActual;
              const actual = i === pasoActual;
              const color = hecho || actual ? BROWN : '#c9c2bb';
              return (
                <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: hecho || actual ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: actual ? BROWN : hecho ? '#F3E7D8' : '#f3f0ed',
                      color: actual ? '#fff' : color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <p.Icono size={14} strokeWidth={2.4} />
                    </div>
                    {i < PASOS.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 14, background: hecho ? '#F3E7D8' : '#f3f0ed' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < PASOS.length - 1 ? 12 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: actual ? 800 : 600, color: actual ? '#2A1A0E' : '#7a7269' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9a938c' }}>{p.detalle}</div>
                  </div>
                </div>
              );
            })}

            {esDomicilio && enCurso.deliveryAddress && (
              <p style={{ fontSize: 11.5, color: '#9a938c', margin: '10px 0 0', lineHeight: 1.45 }}>
                Se lo llevamos a: {enCurso.deliveryAddress}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate('/mi-cuenta/pedidos')}
              style={{
                marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 999,
                border: '1px solid #eee', background: '#fff', color: BROWN,
                fontSize: 12.5, fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              Ver el pedido <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* La burbuja: el icono del paso actual y su nombre */}
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-label={`Su pedido: ${paso.label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          height: 52,
          padding: '0 18px 0 14px',
          borderRadius: 999,
          border: 'none',
          background: BROWN,
          color: '#fff',
          boxShadow: '0 10px 26px rgba(140,86,40,0.42)',
          fontSize: 13.5,
          fontWeight: 700,
        }}
      >
        {esDomicilio && enCurso.status === 'preparando'
          ? <Bike size={19} strokeWidth={2.2} />
          : <paso.Icono size={19} strokeWidth={2.2} />}
        {paso.label}
        {/* El puntito que respira: dice "esto sigue en curso" sin decir nada */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#8ee6a8',
          boxShadow: '0 0 0 0 rgba(142,230,168,.7)',
          animation: 'latido 1.8s ease-out infinite',
        }} />
      </button>

      <style>{`
        @keyframes latido {
          0%   { box-shadow: 0 0 0 0 rgba(142,230,168,.7); }
          70%  { box-shadow: 0 0 0 9px rgba(142,230,168,0); }
          100% { box-shadow: 0 0 0 0 rgba(142,230,168,0); }
        }
      `}</style>
    </div>
  );
};

export default BurbujaPedido;
