import styled from 'styled-components';
import { MessageCircle, MapPin } from 'lucide-react';
import { usePieTienda } from '../../hooks/usePieTienda';

/*
 * ============================================================
 * PIE DE LA TIENDA — PieTienda.jsx
 * ============================================================
 * El final de la página, que hasta ahora no existía: se acababan los productos
 * y quedaba el blanco.
 *
 * Un pie sirve para dos cosas concretas, y este hace esas dos:
 *   1. Cerrar. Sin él, la página no termina, se corta. La banda café tenue
 *      es la señal de "hasta aquí llegó la tienda".
 *   2. Recoger a quien no encontró lo que buscaba arriba. Por eso están los
 *      pasillos y el WhatsApp, no un menú de veinte enlaces.
 *
 * Lo que NO tiene, a propósito: horarios, correo y redes sociales inventadas.
 * Ver el porqué en utils/tienda.js.
 *
 * Todo lo que decide qué se muestra vive en usePieTienda. Aquí solo se pinta.
 * ============================================================
 */

const Banda = styled.footer`
  background: var(--marca-50);
  border-top: 1px solid var(--linea);
  margin-top: 64px;
  padding: 48px 0 0;
`;

/*
 * Mismo ancho y mismo margen lateral que el <Content> de la tienda (1400 + 28).
 * El relleno va AQUÍ y no en la banda, porque la banda tiene que llegar de
 * orilla a orilla: si el color se corta a 28px del borde, deja de leerse como
 * el piso de la página y parece una tarjeta más.
 */
const Interior = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 28px;

  @media (max-width: 560px) { padding: 0 16px; }
`;

/*
 * auto-fit en vez de un número fijo de columnas: en el teléfono cae a una sola,
 * en tablet a dos, y en pantalla grande a cuatro, sin escribir tres media
 * queries que después haya que mantener en paralelo.
 */
const Columnas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 36px 28px;
  padding-bottom: 40px;
`;

const Marca = styled.div`
  /* La marca pide más aire que una columna de enlaces. */
  grid-column: span 1;
  @media (min-width: 900px) { min-width: 250px; }
`;

// Las dos líneas del nombre, con el MISMO peso y color que en el encabezado:
// "Tienda" no es una etiqueta que acompaña, es parte del nombre del negocio.
const Nombre = styled.p`
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.05;
  color: var(--tinta);
  margin: 0 0 12px;
`;

const Frase = styled.p`
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--tinta-suave);
  margin: 0 0 18px;
  max-width: 34ch;
`;

const Dato = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--tinta-suave);
  margin: 0 0 14px;

  svg { flex-shrink: 0; margin-top: 1px; color: var(--tinta-tenue); }
`;

const BotonWhats = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radio-pill);
  border: 1px solid var(--linea);
  background: var(--papel);
  color: var(--tinta);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { border-color: var(--marca-600); color: var(--marca-700); }
  }
  &:active { transform: scale(0.97); }
`;

const TituloColumna = styled.h3`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--tinta-tenue);
  margin: 0 0 14px;
`;

const Lista = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/*
 * Enlaces que solo cambian de COLOR al pasar el cursor, sin moverse.
 *
 * Un pie es una lista que se recorre con la vista de arriba abajo; si cada
 * renglón se corre al pasarle por encima, la columna entera parece temblar
 * mientras uno la lee.
 */
const Enlace = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13.5px;
  text-align: left;
  color: var(--tinta-suave);
  cursor: pointer;
  transition: color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { color: var(--marca-700); }
  }
`;

const Cierre = styled.div`
  border-top: 1px solid var(--linea);
  padding: 18px 0 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  color: var(--tinta-tenue);
`;

const PieTienda = () => {
  const { pasillos, enlacesCuenta, ir, whatsapp, direccion, nombre, anio } = usePieTienda();

  return (
    <Banda>
      <Interior>
        <Columnas>
          <Marca>
            <Nombre>Tienda<br />la 635</Nombre>
            <Frase>
              La tienda del barrio, ahora también en línea. Pida lo de la casa y
              se lo llevamos.
            </Frase>
            <Dato>
              <MapPin size={15} strokeWidth={2} />
              {direccion}
            </Dato>
            {/* Sin número configurado no se pinta el botón: uno que no lleva a
                ningún lado es peor que no tener botón. */}
            {whatsapp && (
              <BotonWhats href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} strokeWidth={2.2} />
                Escríbanos por WhatsApp
              </BotonWhats>
            )}
          </Marca>

          {/* Los pasillos salen de la base: el día que abran la panadería,
              aparece sola aquí abajo sin que nadie venga a agregarla. */}
          {pasillos.length > 0 && (
            <div>
              <TituloColumna>Pasillos</TituloColumna>
              <Lista>
                {pasillos.map((p) => (
                  <li key={p.id}>
                    <Enlace onClick={() => ir(p.ruta)}>{p.texto}</Enlace>
                  </li>
                ))}
              </Lista>
            </div>
          )}

          <div>
            <TituloColumna>Mi cuenta</TituloColumna>
            <Lista>
              {enlacesCuenta.map((e) => (
                <li key={e.ruta}>
                  <Enlace onClick={() => ir(e.ruta)}>{e.texto}</Enlace>
                </li>
              ))}
            </Lista>
          </div>
        </Columnas>

        <Cierre>
          <span>© {anio} {nombre}</span>
          <span>Hecho en El Salvador</span>
        </Cierre>
      </Interior>
    </Banda>
  );
};

export default PieTienda;
