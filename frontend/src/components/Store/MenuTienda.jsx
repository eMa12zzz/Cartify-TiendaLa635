import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, Store as StoreIcon, Check } from 'lucide-react';
import { useDropdown } from '../../hooks/useDropdown';
import { useModulos } from '../../hooks/useModulos';
import { useAjustesCtx } from '../../context/AjustesContext';
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
  color: #6b6b6b;
  display: flex;
  align-items: center;
`;

// Las dos líneas del nombre, con el MISMO peso y color: "Tienda" no es una
// etiqueta que acompaña, es parte del nombre del negocio.
const Nombre = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
`;

const Linea = styled.span`
  font-size: 19px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;

  @media (max-width: 700px) { font-size: 15.5px; }
`;

/*
 * El logo, cuando la tienda subió uno. Se limita por ALTURA y no por ancho:
 * un logo puede ser cuadrado o una banda larga, y lo único que no puede es
 * crecerle al encabezado, que mide 64px y ya está lleno.
 */
const Logo = styled.img`
  height: 38px;
  width: auto;
  max-width: 168px;
  object-fit: contain;
  display: block;

  @media (max-width: 700px) { height: 31px; max-width: 124px; }
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 268px;
  background: #fff;
  border: 1px solid #F0E7DE;
  border-radius: 16px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
  padding: 6px;
  z-index: 300;
  animation: cardIn 180ms var(--ease-out, ease);

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
  color: #9a938c;
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
  color: #2A1A0E;
  min-height: 44px;

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: var(--marca-50, #FAF5F0); }
  }
`;

const MenuTienda = ({ moduloSeleccionado, onElegirModulo }) => {
  const navigate = useNavigate();
  const { isOpen, toggle, close, ref } = useDropdown();
  const { modulos } = useModulos();
  // El nombre y el logo salen de la base, no del código. Ver AjustesContext.
  const { ajustes } = useAjustesCtx();

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
    onElegirModulo?.(null);
  };

  return (
    <Zona ref={ref}>
      <Boton onClick={toggle} aria-expanded={isOpen} aria-haspopup="menu" aria-label="Pasillos de la tienda">
        <Hamburguesa><Menu size={20} strokeWidth={2.2} /></Hamburguesa>
        {/*
          Con logo se pinta el logo; sin logo, el nombre en dos líneas, que es
          como estuvo siempre. El `alt` lleva el nombre escrito para que quien
          usa lector de pantalla oiga la tienda y no "imagen".
        */}
        {ajustes.logoUrl ? (
          <Logo
            src={ajustes.logoUrl}
            alt={`${ajustes.nombreLinea1} ${ajustes.nombreLinea2}`.trim()}
          />
        ) : (
          <Nombre>
            <Linea>{ajustes.nombreLinea1}</Linea>
            {ajustes.nombreLinea2 && <Linea>{ajustes.nombreLinea2}</Linea>}
          </Nombre>
        )}
      </Boton>

      {isOpen && (
        <Panel role="menu">
          <Titulo>Pasillos de la tienda</Titulo>

          <Opcion role="menuitem" $activa={!moduloSeleccionado} onClick={verTodo}>
            <StoreIcon size={17} strokeWidth={2.1} color={!moduloSeleccionado ? BROWN : '#9a938c'} />
            Toda la tienda
            {!moduloSeleccionado && <Check size={15} strokeWidth={2.6} color={BROWN} style={{ marginLeft: 'auto' }} />}
          </Opcion>

          {modulos.map((m) => {
            const Icono = iconoDeModulo(m);
            const activa = String(moduloSeleccionado) === String(m._id);
            return (
              <Opcion key={m._id} role="menuitem" $activa={activa} onClick={() => abrir(m)}>
                <Icono size={17} strokeWidth={2.1} color={activa ? BROWN : '#9a938c'} />
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
