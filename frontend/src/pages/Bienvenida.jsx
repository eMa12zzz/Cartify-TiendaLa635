import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { LocateFixed, MapPin, Loader2, Home, Signpost } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useUbicacion, CENTRO_POR_DEFECTO } from '../hooks/useUbicacion';
import { clientService } from '../api/clientService';

/*
 * ============================================================
 * BIENVENIDA — la primera pantalla después de entrar
 * ============================================================
 * Un saludo sobre el mapa, para que el cliente deje su dirección de entrega
 * antes de empezar a comprar. Se puede omitir: pedir la dirección a alguien
 * que solo quiere ver precios es la forma más rápida de perderlo.
 *
 * El mapa es OpenStreetMap con Leaflet, no Google Maps: la llave de Google
 * del proyecto vence y Maps exige facturación con tarjeta. Esto es gratis y
 * sin llave.
 * ============================================================
 */

const BROWN = '#B46C30';
const BROWN_DARK = '#8A5222';

const Pantalla = styled.div`
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;

  /* El mapa ocupa todo el fondo */
  .leaflet-container {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
    z-index: 0;
  }
`;

/*
 * Velo sobre el mapa: sin él, el texto blanco de la tarjeta compite con las
 * calles y no se lee. Es más oscuro arriba, donde va el saludo.
 */
const Velo = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(28,18,10,0.86) 0%,
    rgba(28,18,10,0.66) 22%,
    rgba(28,18,10,0.28) 48%,
    rgba(28,18,10,0.72) 100%
  );
`;

const Contenido = styled.div`
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 40px 20px 28px;
  pointer-events: none;

  /* Solo la tarjeta y los botones reciben el click; el mapa sigue vivo detrás */
  > * { pointer-events: auto; }
`;

const Saludo = styled.div`
  text-align: center;
  color: #fff;
  max-width: 560px;
`;

const Marca = styled.div`
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 10px;
`;

const Titulo = styled.h1`
  font-size: clamp(30px, 5vw, 46px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 12px;
  text-shadow: 0 2px 24px rgba(0,0,0,0.35);
`;

const Bajada = styled.p`
  font-size: 15px;
  line-height: 1.55;
  opacity: 0.92;
  margin: 0;
`;

const Tarjeta = styled.div`
  width: 100%;
  max-width: 520px;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.35);
`;

const Etiqueta = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 7px;
`;

const Campo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 0 12px;
  background: #fff;

  input {
    flex: 1;
    border: none;
    outline: none;
    padding: 13px 0;
    font-size: 14px;
    font-family: inherit;
    color: #2A1A0E;
    background: transparent;
  }
`;

/* Nombre y referencia lado a lado; apilados en pantalla angosta. */
const Dos = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const Fila = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 480px) { flex-direction: column-reverse; }
`;

const Boton = styled.button`
  flex: 1;
  padding: 13px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid ${(p) => (p.$primario ? BROWN : '#e0e0e0')};
  background: ${(p) => (p.$primario ? BROWN : '#fff')};
  color: ${(p) => (p.$primario ? '#fff' : '#555')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color var(--dur-press) var(--ease-out);

  &:hover:not(:disabled) { background: ${(p) => (p.$primario ? BROWN_DARK : '#f7f7f7')}; }
  &:disabled { opacity: 0.6; }
`;

const Ubicarme = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px dashed ${BROWN};
  background: #FBF6F0;
  color: ${BROWN_DARK};
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
`;

const Ayuda = styled.p`
  font-size: 12px;
  color: #8b8b8b;
  margin: 10px 0 0;
  line-height: 1.5;
`;

/*
 * El pin se dibuja con HTML y no con la imagen que trae Leaflet: sus iconos
 * se cargan por ruta relativa y con Vite terminan rotos. Además así combina
 * con el resto de la tienda.
 */
const pinCafe = divIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    background:${BROWN};transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

// Mueve el pin adonde toquen el mapa.
const AlTocarElMapa = ({ onTocar }) => {
  useMapEvents({ click: (e) => onTocar({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

// Recentra el mapa cuando aparece una posición nueva (el GPS, por ejemplo).
const SeguirPosicion = ({ posicion }) => {
  const mapa = useMap();
  if (posicion) mapa.flyTo([posicion.lat, posicion.lng], 17, { duration: 0.8 });
  return null;
};

const Bienvenida = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { posicion, direccion, setDireccion, buscando, localizando, marcarEn, localizarme } = useUbicacion();
  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');
  const [guardando, setGuardando] = useState(false);

  const primerNombre = (user?.fullName || '').split(' ')[0];

  /*
   * La misma pantalla sirve para dos cosas: el saludo de entrada y agregar
   * otra dirección desde Mi Cuenta. Cuando viene con ?volver=, es lo segundo:
   * cambia el texto y regresa a donde estaba en lugar de ir a servicios.
   */
  const volverA = searchParams.get('volver');
  const esAgregar = !!volverA;
  const destinoAlSalir = volverA || '/tienda-dashboard';

  const alOmitir = () => navigate(destinoAlSalir);

  const alGuardar = async () => {
    const limpia = direccion.trim();
    if (!limpia) {
      toast('Escriba su dirección o toque el mapa para marcarla');
      return;
    }

    setGuardando(true);
    try {
      /*
       * Se agrega a las que ya tenga en vez de reemplazarlas: alguien puede
       * entrar por segunda vez desde otro lugar, y perder la dirección de la
       * casa por eso sería un desastre.
       */
      const cliente = await clientService.getClientById(user.id);
      const previas = Array.isArray(cliente?.clientAddress) ? cliente.clientAddress : [];
      const nueva = {
        // Sin nombre puesto, se usa uno según cuántas lleve: "Dirección 2".
        nombre: nombre.trim() || `Dirección ${previas.length + 1}`,
        direccion: limpia,
        referencia: referencia.trim(),
        lat: posicion?.lat ?? null,
        lng: posicion?.lng ?? null,
      };
      await clientService.updateAddresses(user.id, [...previas, nueva]);
      toast.success('Dirección guardada');
      navigate(destinoAlSalir);
    } catch (error) {
      // El interceptor ya avisa del error; aquí solo se deja seguir.
      setGuardando(false);
    }
  };

  const centro = posicion || CENTRO_POR_DEFECTO;

  return (
    <Pantalla>
      <MapContainer
        center={[centro.lat, centro.lng]}
        zoom={posicion ? 17 : 13}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <AlTocarElMapa onTocar={marcarEn} />
        <SeguirPosicion posicion={posicion} />
        {posicion && (
          <Marker
            position={[posicion.lat, posicion.lng]}
            icon={pinCafe}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                marcarEn({ lat, lng });
              },
            }}
          />
        )}
      </MapContainer>

      <Velo />

      <Contenido>
        {/*
          "Bienvenido" tiene género y la mitad de la clientela es mujer. "Hola"
          y "le damos la bienvenida" saludan igual de bien sin dejar a nadie
          fuera, y de paso funcionan si el nombre no está cargado.
        */}
        <Saludo>
          <Marca>Tienda la 635</Marca>
          <Titulo>
            {esAgregar
              ? 'Nueva dirección'
              : primerNombre ? `¡Hola, ${primerNombre}!` : '¡Hola!'}
          </Titulo>
          <Bajada>
            {esAgregar
              ? 'Marque el punto en el mapa y póngale un nombre para reconocerla después.'
              : 'Le damos la bienvenida. Díganos dónde le dejamos sus pedidos: toque el mapa para marcar el punto o use su ubicación.'}
          </Bajada>
        </Saludo>

        <Tarjeta>
          <Etiqueta htmlFor="direccion">Su dirección de entrega</Etiqueta>
          <Campo>
            <MapPin size={17} color={BROWN} />
            <input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder={buscando ? 'Buscando la dirección…' : 'Ej. Calle Los Almendros #12, San Salvador'}
            />
            {buscando && <Loader2 size={16} className="animate-spin" color={BROWN} />}
          </Campo>

          <Ubicarme type="button" onClick={localizarme} disabled={localizando}>
            {localizando ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
            {localizando ? 'Ubicándolo…' : 'Usar mi ubicación'}
          </Ubicarme>

          {/*
            Nombre y referencia. El nombre es para el cliente —para elegir
            rápido entre "Casa" y "Trabajo" al pagar—; la referencia es para
            el repartidor, que en el barrio se guía por el portón verde y no
            por el número de casa.
          */}
          <Dos>
            <div>
              <Etiqueta htmlFor="nombre">Nombre de la dirección</Etiqueta>
              <Campo>
                <Home size={16} color={BROWN} />
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={30}
                  placeholder="Casa, Trabajo…"
                />
              </Campo>
            </div>
            <div>
              <Etiqueta htmlFor="referencia">Punto de referencia</Etiqueta>
              <Campo>
                <Signpost size={16} color={BROWN} />
                <input
                  id="referencia"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  maxLength={80}
                  placeholder="Frente a la cancha, portón verde…"
                />
              </Campo>
            </div>
          </Dos>

          <Fila>
            <Boton type="button" onClick={alOmitir}>
              {esAgregar ? 'Cancelar' : 'Omitir por ahora'}
            </Boton>
            <Boton type="button" $primario onClick={alGuardar} disabled={guardando || buscando}>
              {guardando ? 'Guardando…' : esAgregar ? 'Guardar dirección' : 'Guardar y entrar'}
            </Boton>
          </Fila>

          {!esAgregar && (
            <Ayuda>
              Si la omite, puede agregarla después desde <b>Mi Cuenta → Direcciones</b>.
            </Ayuda>
          )}
        </Tarjeta>
      </Contenido>
    </Pantalla>
  );
};

export default Bienvenida;
