import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { MapPin, ChevronDown, Check, Plus, Signpost, TriangleAlert } from 'lucide-react';
import { useDropdown } from '../../hooks/useDropdown';
import { useDireccionCtx } from '../../context/DireccionContext';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * SELECTOR DE DIRECCIÓN — el "entregar en" del encabezado
 * ============================================================
 * A la par del nombre de la tienda, dice a dónde va el pedido y deja
 * cambiarlo sin salir de comprar.
 *
 * Antes esto vivía escondido hasta el último paso del carrito, y arrancaba
 * siempre en la primera dirección guardada. Quien tiene dos (la casa y el
 * trabajo) tenía que acordarse de cambiarla justo cuando ya solo quería
 * pagar. Arriba se ve todo el tiempo, que es la única manera de que se note
 * cuando está equivocada.
 *
 * La lógica no vive aquí: el contexto manda. Este componente solo pinta.
 * ============================================================
 */

const BROWN = '#B46C30';

const Zona = styled.div`
  position: relative;
  flex-shrink: 0;
  /*
   * Separado del nombre de la tienda con una línea: pegado se leía como si
   * la dirección fuera parte del nombre del negocio.
   */
  padding-left: 18px;
  margin-left: 4px;
  border-left: 1px solid var(--linea, #ebebeb);

  /* En pantalla chica el nombre de la tienda y el buscador mandan. */
  @media (max-width: 820px) {
    display: none;
  }
`;

const Boton = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 8px;
  border-radius: 10px;
  max-width: 230px;
  transition: background-color var(--dur-press, 120ms) var(--ease-out, ease);

  &:hover { background: var(--marca-50, #FAF5F0); }
`;

const Textos = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
`;

const Arriba = styled.span`
  font-size: 11px;
  color: #aaa;
  line-height: 1;
`;

const Nombre = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #111;
  line-height: 1.3;
  max-width: 165px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 8px;
  width: 290px;
  background: #fff;
  border: 1px solid #F0E7DE;
  border-radius: 16px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
  padding: 6px;
  z-index: 300;
  animation: cardIn 180ms var(--ease-out, ease);
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
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 11px;

  &:hover { background: var(--marca-50, #FAF5F0); }
`;

const Agregar = styled(Opcion)`
  color: ${BROWN};
  font-weight: 700;
  font-size: 13px;
  align-items: center;
  border-top: 1px solid #F4EEE8;
  border-radius: 0 0 11px 11px;
  margin-top: 4px;
`;

/*
 * El aviso de dirección incompleta.
 *
 * Las direcciones viejas se guardaron como texto suelto, sin punto en el
 * mapa. Se entregan igual —el repartidor lee la calle— pero no se puede
 * seguir el pedido ni calcular cuánto falta. Vale más decirlo que dejar a la
 * persona esperando un mapa que nunca va a aparecer.
 */
const Aviso = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 2px 6px 6px;
  padding: 9px 10px;
  border-radius: 11px;
  background: #FFF6E9;
  border: 1px solid #F3DFC0;
  font-size: 11.5px;
  line-height: 1.45;
  color: #7A3E08;
`;

const SinPunto = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #B4590C;
  margin-top: 3px;
`;

const Vacio = styled.p`
  font-size: 12.5px;
  color: #9a938c;
  line-height: 1.5;
  margin: 4px 10px 10px;
`;

const SelectorDireccion = () => {
  const navigate = useNavigate();
  const { isOpen, toggle, close, ref } = useDropdown();
  const { direcciones, indice, etiqueta, cargando, elegir, activa } = useDireccionCtx();
  const { user } = useAuth();

  // Una dirección "completa" es la que trae punto en el mapa; sin eso no hay
  // seguimiento en vivo ni tiempo estimado, solo un texto para el repartidor.
  const sinPunto = (dir) => dir?.lat == null || dir?.lng == null;

  /*
   * El mapa es la única forma de dar de alta una dirección (así queda con
   * coordenadas y el repartidor la encuentra). Al guardar vuelve a la tienda,
   * no a Mi Cuenta: quien estaba comprando quiere seguir comprando.
   */
  const abrirMapa = () => {
    close();
    navigate('/bienvenida?volver=/store');
  };

  /*
   * Sin cuenta no hay direcciones que mostrar. Quien entra de curioso no
   * tiene por qué ver un "Entregar en" vacío ni que le pidan una dirección
   * antes de haber visto un solo precio.
   */
  if (user?.type !== 'client') return null;

  // Mientras carga no se pinta nada: un "Sin dirección" que parpadea y
  // después cambia se siente roto aunque no lo esté.
  if (cargando) return null;

  return (
    <Zona ref={ref}>
      {/*
        Dos líneas, como el logo de al lado: la etiqueta chiquita arriba y el
        nombre de la dirección abajo. Sin icono — el pin solo repetía lo que
        ya dice "Entregar en", y en un encabezado cada elemento de más le
        quita aire al buscador.
      */}
      <Boton onClick={toggle} aria-expanded={isOpen} aria-haspopup="listbox">
        <Textos>
          <Arriba>Entregar en</Arriba>
          <Nombre>{etiqueta || 'Elegir dirección'}</Nombre>
        </Textos>
        <ChevronDown size={16} strokeWidth={2.4} color="#777" />
      </Boton>

      {isOpen && (
        <Panel role="listbox">
          <Titulo>Sus direcciones</Titulo>

          {activa && sinPunto(activa) && (
            <Aviso>
              <TriangleAlert size={14} strokeWidth={2.3} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Complete los detalles de esta dirección.</strong> No tiene un punto
                marcado en el mapa, así que no podrá seguir su pedido en vivo.
              </span>
            </Aviso>
          )}

          {direcciones.length === 0 ? (
            <Vacio>Todavía no tiene direcciones guardadas. Marque en el mapa dónde le dejamos sus pedidos.</Vacio>
          ) : (
            direcciones.map((dir, i) => (
              <Opcion
                key={i}
                $activa={i === indice}
                role="option"
                aria-selected={i === indice}
                onClick={() => { elegir(i); close(); }}
              >
                <MapPin
                  size={16}
                  strokeWidth={2.2}
                  color={i === indice ? BROWN : '#c9c2bb'}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  {dir.nombre && (
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#2A1A0E' }}>
                      {dir.nombre}
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: 12.5, color: '#7a7269', lineHeight: 1.4 }}>
                    {dir.direccion}
                  </span>
                  {dir.referencia && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#9a938c', marginTop: 2 }}>
                      <Signpost size={12} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      {dir.referencia}
                    </span>
                  )}
                  {/* Se marca en la lista, no solo en la elegida: así se ve
                      cuál conviene usar antes de tocarla */}
                  {sinPunto(dir) && (
                    <SinPunto>
                      <TriangleAlert size={11} strokeWidth={2.4} /> Complete los detalles
                    </SinPunto>
                  )}
                </span>
                {i === indice && <Check size={16} strokeWidth={2.6} color={BROWN} style={{ flexShrink: 0, marginTop: 2 }} />}
              </Opcion>
            ))
          )}

          <Agregar onClick={abrirMapa}>
            <Plus size={15} strokeWidth={2.6} /> Agregar en el mapa
          </Agregar>
        </Panel>
      )}
    </Zona>
  );
};

export default SelectorDireccion;
