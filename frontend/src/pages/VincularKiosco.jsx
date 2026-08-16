import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Check, Store, Loader2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { kioscoService } from '../api/kioscoService';

/*
 * ============================================================
 * VINCULAR KIOSCO — lo que abre el teléfono al escanear el QR
 * ============================================================
 * Es la mitad del cliente: el kiosco muestra el código, y esta pantalla
 * —abierta en SU teléfono, donde ya inició sesión— lo reclama.
 *
 * Todo el diseño responde a que se lee de pie, en dos segundos, con una
 * mano y con alguien esperando atrás en la fila: una sola pregunta y un
 * botón grande.
 *
 * Nunca vincula sola. Aunque bastaría con abrir el enlace, la confirmación
 * existe porque un QR es algo que uno escanea sin leer: si la compra se
 * pegara a la cuenta con solo apuntar la cámara, cualquier código puesto en
 * la pared le cargaría a alguien una compra ajena.
 */
const VincularKiosco = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [estado, setEstado] = useState('preguntando'); // preguntando | vinculando | listo | error
  const [mensaje, setMensaje] = useState('');

  const esCliente = user?.type === 'client';

  const vincular = async () => {
    setEstado('vinculando');
    try {
      await kioscoService.vincular(codigo, user.id);
      setEstado('listo');
    } catch (e) {
      setMensaje(e?.response?.data?.message || 'No se pudo vincular. Pida un código nuevo en el kiosco.');
      setEstado('error');
    }
  };

  return (
    <div style={hoja}>
      <div style={tarjeta}>
        <div style={sello}>
          <QrCode size={26} strokeWidth={2.2} color="#B46C30" />
        </div>

        {/* Sin sesión no hay a qué cuenta pegarle la compra */}
        {!esCliente ? (
          <>
            <h1 style={titulo}>Inicie sesión para continuar</h1>
            <p style={bajada}>
              Necesitamos saber a qué cuenta cargarle esta compra y sus puntos.
            </p>
            <button
              style={botonPrincipal}
              onClick={() => navigate(`/iniciar-sesion?volver=/vincular/${codigo}`)}
            >
              Iniciar sesión
            </button>
          </>
        ) : estado === 'listo' ? (
          <>
            <div style={{ ...sello, background: '#EFFAF1' }}>
              <Check size={26} strokeWidth={2.6} color="#14663A" />
            </div>
            <h1 style={titulo}>¡Listo, {user.userName || user.fullName}!</h1>
            <p style={bajada}>
              Su compra quedará a su nombre y los puntos le caen solos al pagar.
              Ya puede volver a la pantalla de la tienda.
            </p>
            <button style={botonSuave} onClick={() => navigate('/store')}>
              <Store size={16} /> Ir a la tienda
            </button>
          </>
        ) : estado === 'error' ? (
          <>
            <div style={{ ...sello, background: '#FFF6E9' }}>
              <TriangleAlert size={24} strokeWidth={2.3} color="#B4590C" />
            </div>
            <h1 style={titulo}>No se pudo vincular</h1>
            <p style={bajada}>{mensaje}</p>
            <button style={botonSuave} onClick={() => navigate('/store')}>Volver a la tienda</button>
          </>
        ) : (
          <>
            <h1 style={titulo}>¿Es suya esta compra?</h1>
            <p style={bajada}>
              La compra del kiosco quedará a nombre de <strong>{user.userName || user.fullName}</strong>,
              con sus puntos de fidelidad.
            </p>
            <p style={codigoChip}>{codigo}</p>

            <button style={botonPrincipal} onClick={vincular} disabled={estado === 'vinculando'}>
              {estado === 'vinculando'
                ? <><Loader2 size={17} className="animate-spin" /> Vinculando…</>
                : 'Sí, es mía'}
            </button>
            <button style={botonTexto} onClick={() => navigate('/store')}>
              No fui yo
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Estilos: pensados para leerse de pie y con una mano ──
const hoja = {
  minHeight: '100vh',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const tarjeta = {
  width: '100%',
  maxWidth: 380,
  textAlign: 'center',
  border: '1px solid #F0E7DE',
  borderRadius: 22,
  padding: '32px 24px',
  boxShadow: '0 18px 44px rgba(60,40,20,0.10)',
};

const sello = {
  width: 54, height: 54, borderRadius: 16,
  background: '#FAF3EB',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 16px',
};

const titulo = { fontSize: 22, fontWeight: 800, color: '#1d1206', margin: '0 0 8px' };
const bajada = { fontSize: 14.5, lineHeight: 1.55, color: '#7a7269', margin: '0 0 20px' };

const codigoChip = {
  display: 'inline-block',
  fontSize: 20, fontWeight: 800, letterSpacing: 4,
  color: '#B46C30', background: '#FAF3EB',
  padding: '8px 18px', borderRadius: 12, margin: '0 0 22px',
};

const botonPrincipal = {
  width: '100%', padding: '15px 0', borderRadius: 999, border: 'none',
  background: '#B46C30', color: '#fff', fontSize: 16, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  cursor: 'pointer',
};

const botonSuave = {
  width: '100%', padding: '13px 0', borderRadius: 999,
  border: '1px solid #eee', background: '#fff', color: '#B46C30',
  fontSize: 14.5, fontWeight: 700, marginTop: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  cursor: 'pointer',
};

const botonTexto = {
  width: '100%', padding: '12px 0', border: 'none', background: 'none',
  color: '#9a938c', fontSize: 13.5, fontWeight: 600, marginTop: 6, cursor: 'pointer',
};

export default VincularKiosco;
