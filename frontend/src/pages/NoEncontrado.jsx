import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Store, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Mascota from '../components/UI/Mascota';

/*
 * ============================================================
 * PANTALLA 404 — NoEncontrado.jsx
 * ============================================================
 * Lo que se veía antes en una dirección que no existe: NADA. Blanco absoluto,
 * sin encabezado, sin aviso, sin salida. La persona no tenía forma de saber si
 * escribió mal la dirección, si la página se movió o si la tienda se cayó.
 * Un enlace viejo compartido por WhatsApp bastaba para dejar a alguien mirando
 * una pantalla vacía.
 *
 * Esta pantalla contesta las tres preguntas que uno se hace cuando algo no
 * aparece: qué pasó, si fue culpa mía, y cómo salgo de aquí.
 *
 * A dónde ofrece salir depende de quién sea: al personal se le ofrece el panel
 * (que es donde estaba trabajando) y al cliente la tienda. Mandar al encargado
 * de la tienda a la portada de productos cuando se equivocó de dirección en el
 * panel es hacerle perder dos clics más.
 * ============================================================
 */

const Fondo = styled.div`
  min-height: 100vh;
  background: var(--papel);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
`;

const Caja = styled.div`
  max-width: 460px;
  text-align: center;
`;

/*
 * El "404" con la mascota haciendo de cero: perdida, mirando para un lado.
 * Para un lector de pantalla todo el bloque es una imagen llamada "Error 404".
 */
const Cuatro = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 0 22px;
  font-size: 108px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--tinta);

  @media (max-width: 420px) { font-size: 84px; }
`;

const Titulo = styled.h1`
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--tinta);
  margin: 0 0 12px;
`;

const Texto = styled.p`
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--tinta-suave);
  margin: 0 0 8px;
`;

/*
 * La dirección que se intentó abrir, tal cual. Sirve para lo más común de
 * todo: darse cuenta de que se coló una letra al escribirla o al copiarla.
 */
const Ruta = styled.code`
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
  background: var(--papel-gris);
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12.5px;
  color: var(--tinta-suave);
  margin-bottom: 28px;
`;

const Botones = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Boton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radio-pill);
  border: 1px solid ${(p) => (p.$principal ? 'transparent' : 'var(--linea)')};
  background: ${(p) => (p.$principal ? 'var(--marca-600)' : 'var(--papel)')};
  color: ${(p) => (p.$principal ? '#fff' : 'var(--tinta)')};
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${(p) => (p.$principal ? 'var(--marca-700)' : 'var(--marca-50)')};
      border-color: ${(p) => (p.$principal ? 'transparent' : 'var(--marca-600)')};
    }
  }
  &:active { transform: scale(0.97); }
`;

const NoEncontrado = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, esCliente } = useAuth();
  /*
   * Sin escala derivada. Esta pantalla la calculaba del color que el dueño
   * hubiera elegido y la pintaba en línea, porque en las rutas del panel
   * useTemporada() borra las variables de marca. Pero solo borra los estilos EN
   * LÍNEA; la regla :root de index.css se queda, y ahora la marca vive ahí fija.
   * Así que var(--marca-*) ya resuelve bien sin ayuda de nadie.
   */

  // Personal = tiene sesión pero no es cliente. Su casa es el panel.
  const esPersonal = isAuthenticated && !esCliente;
  const casa = esPersonal ? '/dashboard' : '/';

  return (
    <Fondo>
      <Caja>
        <Cuatro role="img" aria-label="Error 404">
          <span>4</span>
          <Mascota pose="perdida" alto="1.45em" />
          <span>4</span>
        </Cuatro>
        <Titulo>Esta página no existe</Titulo>
        <Texto>
          Puede que la dirección esté mal escrita, o que la página se haya
          movido de lugar. No es nada que usted haya hecho mal.
        </Texto>
        <Ruta>{pathname}</Ruta>

        <Botones>
          <Boton $principal onClick={() => navigate(casa)}>
            {esPersonal
              ? <><LayoutDashboard size={16} strokeWidth={2.2} /> Ir al panel</>
              : <><Store size={16} strokeWidth={2.2} /> Ir a la tienda</>}
          </Boton>
          {/*
            El "atrás" propio se ofrece de segundo y solo si hay a dónde
            volver: si esta fue la primera pantalla de la visita —el caso de
            quien llegó por un enlace roto— el botón no llevaría a ningún lado.
          */}
          {window.history.length > 1 && (
            <Boton onClick={() => navigate(-1)}>
              <ArrowLeft size={16} strokeWidth={2.2} /> Volver atrás
            </Boton>
          )}
        </Botones>
      </Caja>
    </Fondo>
  );
};

export default NoEncontrado;
