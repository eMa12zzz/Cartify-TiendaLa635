import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, ChefHat, Bike, Check, X, ChevronRight } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import { useAuth } from '../../hooks/useAuth';
import { useSeguimientoEnVivo } from '../../hooks/useSeguimientoEnVivo';

/*
 * ============================================================
 * BURBUJA DE PEDIDO — el seguimiento sin salir de la tienda
 * ============================================================
 * Mientras un pedido no esté entregado, el cliente lo ve flotando en la
 * esquina. Antes había que entrar a Mi Cuenta → Mis pedidos para saber si ya
 * lo estaban preparando, y nadie hace eso: se quedaban mirando el teléfono
 * sin novedad de que algo estuviera pasando.
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

// Los dos puntos del mapita: quien trae el pedido y la casa a donde va.
const pinRepartidor = divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2563eb;border:3px solid #fff;
    box-shadow:0 0 0 5px rgba(37,99,235,.22), 0 2px 6px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const pinCasa = divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50% 50% 50% 0;
    background:${BROWN};transform:rotate(-45deg);
    border:2.5px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

/*
 * Encuadra el mapa para que se vean los dos puntos a la vez.
 *
 * Centrado solo en el repartidor, la casa quedaba fuera y el mapa no
 * respondía la única pregunta que importa: ¿qué tan cerca va de mí? Conforme
 * se acerca, el encuadre se va cerrando solo, y ese apretarse cuenta el
 * avance sin necesidad de una barra de progreso.
 */
const EncuadreDeViaje = ({ punto, destino }) => {
  const mapa = useMap();

  if (punto && destino) {
    mapa.fitBounds(latLngBounds([punto.lat, punto.lng], [destino.lat, destino.lng]), {
      padding: [34, 34],
      maxZoom: 16,
      animate: true,
    });
  } else if (punto) {
    // Pedidos viejos, sin punto de destino guardado: al menos se ve al que viene.
    mapa.setView([punto.lat, punto.lng], 15);
  }

  return null;
};

const BurbujaPedido = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useMyOrders();
  const [abierta, setAbierta] = useState(false);

  /*
   * Cerrar NO desaparece la burbuja: la encoge.
   *
   * Antes la X la quitaba para siempre y no había manera de traerla de
   * vuelta; con el seguimiento en vivo adentro eso significaba perder el mapa
   * del repartidor por un toque sin querer. Ahora queda un botón chiquito, y
   * si el pedido avanza (lo empiezan a preparar, sale el repartidor) se
   * reabre sola: eso es justo lo que la persona quería saber.
   */
  const [encogidaEn, setEncogidaEn] = useState(null); // { id, estado }

  /*
   * El pedido en curso: el más reciente que todavía no se entregó ni se
   * canceló. Si tiene varios, se sigue el último — es el que acaba de hacer.
   *
   * Se calcula ANTES de cualquier return porque el hook de seguimiento de
   * abajo necesita su id, y los hooks no se pueden llamar a medias.
   */
  const enCurso = user?.type === 'client'
    ? (orders || [])
        .filter((o) => ['pagado', 'preparando'].includes(o.status))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
    : null;

  const seguimiento = useSeguimientoEnVivo(enCurso?._id, !!enCurso);

  // Solo los clientes tienen pedidos que seguir.
  if (user?.type !== 'client') return null;
  if (!enCurso) return null;

  /*
   * El estado que manda es el que acaba de traer el seguimiento: la lista de
   * pedidos se cargó una vez al abrir la tienda y para cuando la tienda
   * empieza a preparar, ya está vieja.
   */
  const estado = seguimiento.estado || enCurso.status;
  const pasoActual = PASOS.findIndex((p) => p.id === estado);
  const paso = PASOS[pasoActual] || PASOS[0];
  const esDomicilio = enCurso.deliveryType === 'delivery';
  const enCamino = esDomicilio && seguimiento.enVivo;

  // Un pedido cancelado no se sigue: la burbuja se va sola.
  if (estado === 'cancelado') return null;

  // La "novedad" del pedido: si cambió desde que la encogieron, se reabre.
  const novedad = `${estado}|${enCamino ? 'en-camino' : ''}`;
  const encogida = encogidaEn?.id === String(enCurso._id) && encogidaEn?.novedad === novedad;

  const encoger = () => {
    setAbierta(false);
    setEncogidaEn({ id: String(enCurso._id), novedad });
  };

  const agrandar = () => {
    setEncogidaEn(null);
    setAbierta(true);
  };

  /*
   * Encogida: un botón redondo con el icono del paso, nada más. Ocupa poco,
   * no tapa la tienda y siempre se puede volver.
   */
  if (encogida) {
    return (
      <button
        type="button"
        onClick={agrandar}
        aria-label={`Ver su pedido: ${enCamino ? seguimiento.espera : paso.label}`}
        style={{
          position: 'fixed',
          left: 'max(20px, env(safe-area-inset-left))',
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
          zIndex: 900,
          width: 44, height: 44, borderRadius: '50%',
          border: 'none', background: BROWN, color: '#fff',
          boxShadow: '0 8px 20px rgba(140,86,40,0.38)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {enCamino ? <Bike size={19} strokeWidth={2.3} /> : <paso.Icono size={19} strokeWidth={2.3} />}
      </button>
    );
  }

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
              onClick={encoger}
              aria-label="Encoger el seguimiento"
              style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          {/*
            El mapa solo aparece cuando de verdad hay alguien en camino con la
            novedad fresca. Un mapa con un punto viejo es peor que no tener
            mapa: el cliente sale a la banqueta a esperar a alguien que va
            tres calles atrás.
          */}
          {enCamino && (
            <div>
              <div style={{ height: 132 }}>
                <MapContainer
                  center={[seguimiento.punto.lat, seguimiento.punto.lng]}
                  zoom={15}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[seguimiento.punto.lat, seguimiento.punto.lng]} icon={pinRepartidor} />
                  {seguimiento.destino && (
                    <Marker position={[seguimiento.destino.lat, seguimiento.destino.lng]} icon={pinCasa} />
                  )}
                  <EncuadreDeViaje punto={seguimiento.punto} destino={seguimiento.destino} />
                </MapContainer>
              </div>
              {/*
                En las últimas cuadras la franja se pone verde y cambia el
                texto. No es adorno: es la diferencia entre "está en camino"
                (información) y "levántese" (una instrucción).
              */}
              <div style={{
                padding: '10px 14px',
                background: seguimiento.yaCasi ? '#EFFAF1' : '#F7FAFF',
                borderBottom: `1px solid ${seguimiento.yaCasi ? '#D3EEDA' : '#EAF0FA'}`,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 800,
                  color: seguimiento.yaCasi ? '#14663A' : '#173F94',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Bike size={15} strokeWidth={2.4} />
                  {seguimiento.yaCasi ? 'Ya casi toca su puerta' : seguimiento.espera}
                </div>
                <div style={{ fontSize: 11.5, color: seguimiento.yaCasi ? '#3C7A55' : '#5B76B0', marginTop: 2 }}>
                  {seguimiento.repartidor ? `${seguimiento.repartidor} · ` : ''}
                  {/* La distancia solo sale si el pedido guardó su punto en el
                      mapa; los viejos traen nada más la dirección escrita */}
                  {seguimiento.distancia
                    ? `a ${seguimiento.distancia} de su dirección`
                    : 'Le llevan su pedido'}
                </div>
              </div>
            </div>
          )}

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

            {/*
              La honestidad del seguimiento: si el repartidor salió pero su
              teléfono dejó de reportar (se bloqueó la pantalla, se quedó sin
              novedad), se dice tal cual en vez de disimular.
            */}
            {esDomicilio && seguimiento.senalFria && (
              <p style={{ fontSize: 11.5, color: '#9a938c', margin: '10px 0 0', lineHeight: 1.45 }}>
                Su pedido va en camino. La última novedad del repartidor fue hace{' '}
                {seguimiento.minutosDesdeUltimoDato || 1} min.
              </p>
            )}

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
        aria-label={enCamino ? `Su pedido va en camino. ${seguimiento.espera}` : `Su pedido: ${paso.label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          height: 52,
          padding: '0 18px 0 14px',
          borderRadius: 999,
          border: 'none',
          // Verde cuando está por tocar: se distingue de un vistazo, aunque
          // la persona esté al otro lado del cuarto.
          background: seguimiento.yaCasi ? '#14663A' : BROWN,
          color: '#fff',
          boxShadow: seguimiento.yaCasi
            ? '0 10px 26px rgba(20,102,58,0.42)'
            : '0 10px 26px rgba(140,86,40,0.42)',
          fontSize: 13.5,
          fontWeight: 700,
        }}
      >
        {/*
          Cuando alguien ya va en la calle con el pedido, la burbuja cerrada
          lo dice sin que haya que abrirla: es la información que el cliente
          está esperando, y hacerlo tocar para verla sería mezquino.
        */}
        {enCamino || (esDomicilio && estado === 'preparando')
          ? <Bike size={19} strokeWidth={2.2} />
          : <paso.Icono size={19} strokeWidth={2.2} />}
        {enCamino ? (seguimiento.yaCasi ? 'Ya casi llega' : seguimiento.espera) : paso.label}
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
