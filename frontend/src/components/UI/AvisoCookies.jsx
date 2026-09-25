import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { areaDeRuta } from '../../utils/sesion';
import {
  leerConsentimiento,
  guardarConsentimiento,
  suscribirConsentimiento,
  alPedirConfigurar,
} from '../../utils/consentimiento';

/*
 * ============================================================
 * AVISO DE COOKIES — AvisoCookies.jsx
 * ============================================================
 * La franja de abajo que pregunta por las analíticas la primera vez, y que
 * se vuelve a abrir con "Configurar cookies" del pie.
 *
 * Reglas que la hacen honesta y no un obstáculo:
 *   - Rechazar es igual de fácil que aceptar: dos botones del mismo tamaño,
 *     uno al lado del otro. Nada de "Aceptar" enorme y "Más opciones"
 *     escondido.
 *   - No tapa la tienda ni atrapa el foco: es una franja, no un modal. Se
 *     puede seguir comprando sin contestar; mientras no conteste, no se
 *     mide nada.
 *   - Va pegada al borde de abajo y a todo el ancho, sin tarjeta flotando: el
 *     contenido va sobre el fondo, con una línea que lo separa.
 *   - Solo en la tienda y Mi Cuenta. El panel es del personal y no se mide.
 * ============================================================
 */

const Franja = styled.section`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1200;
  background: var(--papel);
  border-top: 1px solid var(--linea);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.08);
  padding: 16px 28px calc(16px + env(safe-area-inset-bottom));

  @media (max-width: 620px) { padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); }
`;

const Interior = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 18px 28px;

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Texto = styled.div`
  flex: 1;
  min-width: 0;

  h2 {
    font-size: 15px;
    font-weight: 700;
    color: var(--tinta);
    margin: 0 0 4px;
  }
  p {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--tinta-suave);
    margin: 0;
  }
  a {
    color: var(--marca-texto-fuerte);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const Botones = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 860px) {
    & > * { flex: 1; }
  }
`;

// Los dos del MISMO tamaño: elegir "no" no puede costar más que elegir "sí".
const Boton = styled.button`
  min-height: 44px;
  padding: 0 20px;
  border-radius: var(--radio-pill);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border: 1.5px solid var(--marca-600);
  background: ${(p) => (p.$solido ? 'var(--marca-600)' : 'var(--papel)')};
  color: ${(p) => (p.$solido ? '#fff' : 'var(--marca-texto-fuerte)')};
  transition: transform var(--dur-press) var(--ease-out);

  &:active { transform: scale(0.97); }
`;

const AvisoCookies = () => {
  const { pathname } = useLocation();
  const consentimiento = useSyncExternalStore(suscribirConsentimiento, leerConsentimiento, () => null);
  const [reabierto, setReabierto] = useState(false);
  const primerBoton = useRef(null);

  // "Configurar cookies" del pie lo vuelve a abrir, con el foco en el primer
  // botón para que con teclado se pueda decidir de una vez.
  useEffect(() => alPedirConfigurar(() => setReabierto(true)), []);
  useEffect(() => {
    if (reabierto) primerBoton.current?.focus();
  }, [reabierto]);

  const enPanel = areaDeRuta(pathname) === 'personal';
  if (enPanel || (consentimiento && !reabierto)) return null;

  const elegir = (analiticas) => {
    guardarConsentimiento(analiticas);
    setReabierto(false);
  };

  return (
    <Franja aria-labelledby="aviso-cookies-titulo">
      <Interior>
        <Texto>
          <h2 id="aviso-cookies-titulo">Sus datos, sus reglas</h2>
          <p>
            Usamos lo necesario para que la tienda funcione: su sesión y su carrito. Si nos deja,
            también medimos las visitas de forma anónima, sin cookies, para mejorar la tienda.{' '}
            <Link to="/cookies">Ver la política de cookies</Link>
            {consentimiento && (
              <> · Ahora tiene las analíticas {consentimiento.analiticas ? 'activadas' : 'apagadas'}.</>
            )}
          </p>
        </Texto>
        <Botones>
          <Boton ref={primerBoton} type="button" onClick={() => elegir(false)}>
            Solo lo necesario
          </Boton>
          <Boton type="button" $solido onClick={() => elegir(true)}>
            Aceptar analíticas
          </Boton>
        </Botones>
      </Interior>
    </Franja>
  );
};

export default AvisoCookies;
