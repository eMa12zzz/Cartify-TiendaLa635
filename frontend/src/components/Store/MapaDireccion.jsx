import { useState } from 'react';
import { LocateFixed, MapPin, Loader2 } from 'lucide-react';
import Mapa from '../Mapa/Mapa';
import { useUbicacion, CENTRO_POR_DEFECTO } from '../../hooks/useUbicacion';
import { EsperaMascota } from '../UI/Mascota';

/*
 * ============================================================
 * MARCAR LA DIRECCIÓN EN EL MAPA — MapaDireccion.jsx
 * ============================================================
 * El mapa donde el cliente pone el pin en su portón, con los campos de la
 * dirección al lado. Se usa SIN salir de donde está: dentro del checkout y
 * dentro de Mi Cuenta → Direcciones.
 *
 * POR QUÉ EL MAPA NO ES OPCIONAL
 * Antes se podía escribir la dirección a ciegas en una caja de texto. El
 * resultado eran direcciones sin coordenadas, y eso rompe tres cosas a la vez:
 *
 *   1. El repartidor sale con un texto y sin saber a qué portón tocar. "Calle
 *      Principal 123" hay en media ciudad.
 *   2. El envío se cobra por DISTANCIA. Sin punto no hay distancia, así que
 *      se cobra solo la tarifa base — de menos para quien vive al otro lado
 *      del municipio.
 *   3. El cliente no puede seguir su pedido en el mapa, porque no hay destino
 *      que dibujar.
 *
 * Por eso aquí no se puede guardar sin pin. Lo que sí se puede es corregir el
 * texto: Nominatim acierta la calle pero no sabe que es "la casa de portón
 * verde", y eso lo pone la persona.
 *
 * POR QUÉ VA INCRUSTADO Y NO EN OTRA PANTALLA
 * Mandar a alguien a otra pantalla en medio del pago es el peor momento para
 * pedirle un viaje: ya tenía la plata en la mano. Antes se resolvió dejándolo
 * escribir a ciegas; la salida buena era traer el mapa aquí, no quitarlo.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

const MapaDireccion = ({ onGuardar, onCancelar, guardando = false, alto = 260 }) => {
  const { posicion, direccion, setDireccion, buscando, localizando, marcarEn, localizarme } = useUbicacion();
  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');

  const centro = posicion || CENTRO_POR_DEFECTO;
  // Sin pin no se guarda: ver el encabezado de este archivo.
  const listo = !!posicion && direccion.trim().length > 0 && !guardando;

  const guardar = (e) => {
    e.preventDefault();
    if (!listo) return;
    onGuardar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      lat: posicion.lat,
      lng: posicion.lng,
    });
  };

  const campo = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid var(--linea)', fontSize: 14, fontFamily: 'inherit',
    background: 'var(--papel)', color: 'var(--tinta)', outline: 'none',
  };

  return (
    <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--linea)', position: 'relative' }}>
        <div style={{ height: alto }}>
          {/*
            Tocar el mapa mueve el pin (la forma natural de decir "aquí" con el
            dedo), y el pin también se arrastra. Cuando el GPS encuentra a la
            persona, el mapa la sigue: sin eso el pin aparecía en su casa y el
            mapa se quedaba mirando el centro de San Salvador.
          */}
          <Mapa
            centro={centro}
            zoom={posicion ? 16 : 13}
            onTocar={marcarEn}
            seguir={{ punto: posicion, zoomMinimo: 16 }}
            controles
            pines={posicion ? [{
              id: 'direccion', lat: posicion.lat, lng: posicion.lng,
              tipo: 'gota', tamano: 22, arrastrable: true, onSoltar: marcarEn,
            }] : []}
          />
        </div>

        {/*
          La instrucción va ENCIMA del mapa y no debajo: si va debajo, en un
          teléfono queda fuera de la pantalla y nadie se entera de que hay que
          tocar algo. Un mapa sin pin no se explica solo.
        */}
        {!posicion && (
          <div style={{
            position: 'absolute', top: 8, left: 8, right: 8, zIndex: 500,
            background: 'color-mix(in srgb, var(--papel) 94%, transparent)', borderRadius: 8, padding: '7px 10px',
            fontSize: 12.5, color: 'var(--tinta-suave)', textAlign: 'center', pointerEvents: 'none',
          }}>
            Toque en el mapa dónde le dejamos su pedido
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={localizarme}
        disabled={localizando}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 999, border: `1.5px solid ${BROWN}`,
          background: 'var(--papel)', color: 'var(--marca-texto)', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: localizando ? 'default' : 'pointer',
          opacity: localizando ? 0.6 : 1,
        }}
      >
        {localizando
          ? <><EsperaMascota alto={19} /> Buscándolo…</>
          : <><LocateFixed size={15} /> Usar mi ubicación</>}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label htmlFor="mapa-direccion" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tinta-suave)' }}>
            Dirección
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="mapa-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder={posicion ? 'Calle, número y colonia' : 'Se llena al marcar en el mapa'}
              style={{ ...campo, marginTop: 3, paddingRight: 34 }}
            />
            {/* Mientras Nominatim traduce el punto a palabras. */}
            {buscando && (
              <Loader2
                size={15}
                className="animate-spin"
                style={{ position: 'absolute', right: 11, top: 14, color: 'var(--tinta-tenue)' }}
              />
            )}
          </div>
          {/*
            El texto se puede corregir a mano. El buscador acierta la calle
            pero no sabe que es "la casa del portón verde".
          */}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="mapa-nombre" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tinta-suave)' }}>
              Nombre <span style={{ fontWeight: 400, color: 'var(--tinta-tenue)' }}>(opcional)</span>
            </label>
            <input
              id="mapa-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Casa, Trabajo…"
              style={{ ...campo, marginTop: 3 }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label htmlFor="mapa-referencia" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tinta-suave)' }}>
              Referencia <span style={{ fontWeight: 400, color: 'var(--tinta-tenue)' }}>(opcional)</span>
            </label>
            <input
              id="mapa-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Portón verde, frente a la cancha"
              style={{ ...campo, marginTop: 3 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: '10px 16px', borderRadius: 999, border: '1px solid var(--linea)',
              background: 'var(--papel)', color: 'var(--tinta-suave)', fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!listo}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 999, border: 'none',
            background: listo ? BROWN : 'var(--linea-fuerte)', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: listo ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <MapPin size={15} />
          {guardando ? 'Guardando…' : posicion ? 'Guardar esta dirección' : 'Marque el punto en el mapa'}
        </button>
      </div>
    </form>
  );
};

export default MapaDireccion;
