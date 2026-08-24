import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, Store as StoreIcon, Check } from 'lucide-react';
import { useDropdown } from '../../hooks/useDropdown';
import { useModulos } from '../../hooks/useModulos';
import MarcaTienda from './MarcaTienda';
import { iconoDeModulo, flujoDeModulo } from '../../utils/modulos';

/*
 * ============================================================
 * MENÚ DE LA TIENDA — el nombre que abre los pasillos
 * ============================================================
 * Tocar el nombre de la tienda despliega sus módulos.
 *
 * Antes ese clic mandaba a la pantalla de Servicios: quien estaba comprando
 * perdía la tienda de vista para elegir un pasillo y tenía que volver. Ahora
 * los pasillos se abren ahí mismo, encima de los productos, y se elige sin
 * salir de ningún lado.
 *
 * La lógica de qué módulos hay y a dónde lleva cada uno no vive aquí: sale
 * de useModulos y de las reglas de utils/modulos.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';

const Zona = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Boton = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 12px;
  transition: background-color var(--dur-press, 120ms) var(--ease-out, ease),
              transform var(--dur-press, 120ms) var(--ease-out, ease);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: var(--marca-50, #FAF5F0); }
  }
  &:active { transform: scale(0.97); }

  /* Menos aire entre el icono y el nombre: en el encabezado de dos renglones
     cada píxel de alto se lo quita a los productos. */
  @media (max-width: 700px) { gap: 7px; }
`;

const Hamburguesa = styled.span`
  color: #6B7280;
  display: flex;
  align-items: center;
`;

// Las dos lineas del nombre y el logo se mudaron a MarcaTienda.jsx, que ahora
// pinta la marca en TODAS las barras. Este archivo solo la coloca.

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 268px;
  background: #fff;
  border: 1px solid #ECE7E1;
  border-radius: 16px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
  padding: 6px;
  z-index: 300;

  /*
   * El panel CRECE desde el botón que lo abrió, no aparece de la nada.
   *
   * Antes entraba con cardIn, que sube 8px y desvanece: la misma entrada que
   * usan las tarjetas de producto. Servía para que no apareciera de golpe, pero
   * no contaba de DÓNDE venía. Con el origen arriba a la izquierda —justo donde
   * está el nombre de la tienda que se acaba de tocar— el menú queda atado a su
   * botón y se entiende qué lo abrió.
   *
   * Los fotogramas viven en index.css con el resto del vocabulario de
   * movimiento, y ahí mismo se apagan con prefers-reduced-motion.
   *
   * (Ojo para quien edite estos comentarios: van DENTRO de un template literal,
   * así que no se pueden usar comillas invertidas — cierran la cadena y el
   * archivo deja de compilar. Pasó.)
   */
  transform-origin: top left;
  animation: panelIn var(--dur-popover, 180ms) var(--ease-out, ease);

  /*
   * Con muchos pasillos la lista pasaba de largo del teléfono y los últimos
   * quedaban fuera de alcance. Que se desplace el panel, nunca la página.
   */
  @media (max-width: 700px) {
    width: min(268px, calc(100vw - 32px));
    max-height: calc(100vh - 150px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

const Titulo = styled.p`
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 8px 10px 6px;
`;

const Opcion = styled.button`
  width: 100%;
  background: ${(p) => (p.$activa ? 'var(--marca-50, #FAF5F0)' : 'none')};
  border: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 10px;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 600;
  color: #1C1614;
  min-height: 44px;

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: var(--marca-50, #FAF5F0); }
  }
`;

const MenuTienda = ({ moduloSeleccionado, onElegirModulo }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isOpen, toggle, close, ref } = useDropdown();
  const { modulos } = useModulos();
  // El nombre y el logo salen de la base, no del código. Ver AjustesContext.

  /*
   * A dónde lleva cada módulo. Los pasillos normales NO navegan: cambian el
   * pasillo de esta misma pantalla, que es más rápido y no pierde el carrito
   * de vista. Solo los de flujo propio (impresiones) abren otra pantalla.
   */
  const abrir = (modulo) => {
    close();
    if (flujoDeModulo(modulo) === 'impresiones') {
      navigate('/impresiones');
      return;
    }
    onElegirModulo?.(modulo._id);
  };

  const verTodo = () => {
    close();
    /*
     * Desde Impresiones hay que VOLVER a la tienda: aquella es pantalla
     * aparte, así que cambiarle el pasillo por props no la saca de ahí.
     */
    if (enPantallaPropia) { navigate('/'); return; }
    onElegirModulo?.(null);
  };

  /*
   * CUÁL PASILLO ESTÁ MARCADO.
   *
   * Los pasillos normales se saben por `moduloSeleccionado`, que es estado de
   * la tienda. Pero Impresiones no es un pasillo de la tienda: es OTRA
   * PANTALLA, y ahí ese estado no existe. El resultado era que al entrar a
   * Impresiones el menú marcaba "Toda la tienda" y dejaba Impresiones sin
   * palomita — justo lo contrario de donde estaba parada la persona.
   *
   * Así que cuando la ruta es la de un flujo propio, quien manda es la RUTA.
   */
  const enPantallaPropia = pathname.startsWith('/impresiones');

  const estaActiva = (modulo) =>
    enPantallaPropia
      ? flujoDeModulo(modulo) === 'impresiones'
      : String(moduloSeleccionado) === String(modulo._id);

  // "Toda la tienda" solo está marcada si de verdad estamos en la tienda.
  const todaLaTienda = !enPantallaPropia && !moduloSeleccionado;

  return (
    <Zona ref={ref}>
      <Boton onClick={toggle} aria-expanded={isOpen} aria-haspopup="menu" aria-label="Pasillos de la tienda">
        <Hamburguesa><Menu size={20} strokeWidth={2.2} /></Hamburguesa>
        {/*
          La marca salió de aquí a MarcaTienda.jsx. Este bloque era el único
          que pintaba el logo, así que las demás barras enseñaban otra cosa;
          ahora todas piden lo mismo. Este es el tamaño de referencia.
        */}
        <MarcaTienda tamano={19} alto={38} />
      </Boton>

      {isOpen && (
        <Panel role="menu">
          <Titulo>Pasillos de la tienda</Titulo>

          <Opcion role="menuitem" $activa={todaLaTienda} onClick={verTodo}>
            <StoreIcon size={17} strokeWidth={2.1} color={todaLaTienda ? BROWN : '#9CA3AF'} />
            Toda la tienda
            {todaLaTienda && <Check size={15} strokeWidth={2.6} color={BROWN} style={{ marginLeft: 'auto' }} />}
          </Opcion>

          {modulos.map((m) => {
            const Icono = iconoDeModulo(m);
            const activa = estaActiva(m);
            return (
              <Opcion key={m._id} role="menuitem" $activa={activa} onClick={() => abrir(m)}>
                <Icono size={17} strokeWidth={2.1} color={activa ? BROWN : '#9CA3AF'} />
                {m.name}
                {activa && <Check size={15} strokeWidth={2.6} color={BROWN} style={{ marginLeft: 'auto' }} />}
              </Opcion>
            );
          })}
        </Panel>
      )}
    </Zona>
  );
};

export default MenuTienda;
