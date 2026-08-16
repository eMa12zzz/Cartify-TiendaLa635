import { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useVolver } from '../hooks/useVolver';
import { useMyOrders } from '../hooks/useMyOrders';
import { useSeccionesTienda } from '../hooks/useSeccionesTienda';
import ProductCard from '../components/Store/ProductCard';
import ProductDetailModal from '../components/Store/ProductDetailModal';
import HeaderTienda from '../components/Store/HeaderTienda';
import PieTienda from '../components/Store/PieTienda';

/*
 * ============================================================
 * SECCIÓN COMPLETA — Seccion.jsx
 * ============================================================
 * La pantalla que abre "Ver todos" (y tocar el nombre de la sección).
 *
 * Las filas de la portada muestran 12 productos y se corren de lado. Está bien
 * para ojear, pero es pésimo para buscar: nadie encuentra el queso que quiere
 * empujando una fila con el dedo veinte veces. Aquí se ven todos de una, en
 * cuadrícula, sin nada más compitiendo por la pantalla.
 *
 * Las secciones se vuelven a armar con el mismo hook de la portada en vez de
 * pasarse por el enrutador. Así, entrar directo por la URL —o recargar, o
 * compartirle el enlace a alguien— funciona igual que llegar desde la tienda.
 * ============================================================
 */

const Contenedor = styled.div`
  min-height: 100vh;
  background: var(--papel);
  display: flex;
  flex-direction: column;
`;

/* La barra cruza toda la pantalla —es el techo de la página— pero lo que lleva
   adentro se alinea con los productos, no con la orilla del monitor. */
/*
 * Ya NO es sticky: el encabezado de la tienda lo es, y dos barras pegadas
 * arriba a la vez se montan una encima de la otra. Esta se queda quieta y se
 * va con el scroll — es un botón de volver, no una barra de navegación.
 */
const Barra = styled.header`
  background: var(--papel);
  border-bottom: 1px solid var(--linea);
  height: 56px;
  display: flex;
  align-items: center;
`;

const BarraInterior = styled.div`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 560px) { padding: 0 16px; }
`;

/*
 * El botón de volver vive DENTRO de la página, no se deja a la flecha del
 * navegador. En el teléfono esa flecha queda lejos del pulgar, y en el kiosco
 * directamente no existe.
 */
const Volver = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid var(--linea);
  border-radius: var(--radio-pill);
  padding: 8px 15px 8px 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--tinta);
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { border-color: var(--marca-600); color: var(--marca-700); }
  }
  &:active { transform: scale(0.97); }
`;

/* Mismo ancho que el <Content> de la tienda, para que al pasar de una pantalla
   a la otra los productos no se corran de lugar. */
const Contenido = styled.main`
  flex: 1;
  padding: 30px 28px 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 560px) { padding: 22px 16px 16px; }
`;

const Titulo = styled.h1`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--tinta);
  margin: 0 0 6px;

  @media (max-width: 560px) { font-size: 25px; }
`;

const Cuenta = styled.p`
  font-size: 14px;
  color: var(--tinta-suave);
  margin: 0 0 26px;
`;

const Cuadricula = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 16px;
`;

const Vacio = styled.div`
  text-align: center;
  padding: 70px 20px;
  color: var(--tinta-suave);

  svg { color: var(--tinta-tenue); margin-bottom: 14px; }
  h2 { font-size: 19px; color: var(--tinta); margin: 0 0 8px; }
  p { font-size: 14px; margin: 0 0 22px; }
`;

const Seccion = () => {
  const { clave } = useParams();
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const { productos, productosDelPasillo, agregarAlCarrito, cargando } = useStore({});
  const { orders } = useMyOrders();
  const secciones = useSeccionesTienda({
    productos: productosDelPasillo,
    pedidos: orders,
  });

  const seccion = secciones.find((s) => s.clave === clave);
  // `todos` trae la lista sin el corte de 12 que se le hace a la fila.
  const lista = seccion?.todos || seccion?.productos || [];

  /*
   * Volver de verdad, no "ir a la portada".
   *
   * Quien llegó desde la tienda venía bajando por las filas: mandarlo a "/" lo
   * deja arriba del todo y con la sección perdida de vista. Retroceder lo
   * devuelve donde estaba, a la altura donde estaba.
   *
   * Y quien llegó por un enlace compartido no tiene a dónde retroceder, así
   * que ahí sí va a la portada. El hook distingue los dos casos.
   */
  const { volver } = useVolver('/store');

  return (
    <Contenedor>
      {/*
        El MISMO encabezado de la tienda, siempre arriba. Esta pantalla tenía
        una barra propia con un solo botón, así que al abrir una sección se
        perdían de vista el buscador, los pasillos y el carrito — y para
        volver a comprar había que retroceder primero.
      */}
      <HeaderTienda />

      <Barra>
        <BarraInterior>
          {/*
            Dice "Volver" a secas y no "Volver a la tienda": lleva a donde
            estabas, que puede ser la tienda filtrada por una búsqueda. Prometer
            "la tienda" y devolver una lista de resultados es mentir en el
            botón. Para ir a la tienda limpia está el nombre en el encabezado.
          */}
          <Volver onClick={volver}>
            <ArrowLeft size={17} strokeWidth={2.3} />
            Volver
          </Volver>
        </BarraInterior>
      </Barra>

      <Contenido>
        {/*
          Mientras carga no se dice "no encontramos la sección": el catálogo
          todavía no llegó, así que ninguna sección existe todavía. Anunciar un
          error que se va a desmentir solo en medio segundo es peor que esperar.
        */}
        {cargando ? (
          <Cuenta>Cargando…</Cuenta>
        ) : !seccion ? (
          <Vacio>
            <PackageOpen size={44} strokeWidth={1.5} />
            <h2>Esta sección ya no está</h2>
            <p>
              Las secciones se arman con lo que hay en existencia, así que
              cambian según lo que va entrando y saliendo de la tienda.
            </p>
            <Volver onClick={volver}>
              <ArrowLeft size={17} strokeWidth={2.3} />
              Volver
            </Volver>
          </Vacio>
        ) : (
          <>
            <Titulo>{seccion.titulo}</Titulo>
            <Cuenta>
              {lista.length} {lista.length === 1 ? 'producto' : 'productos'}
            </Cuenta>

            <Cuadricula>
              {lista.map((producto, i) => (
                <ProductCard
                  key={producto.id}
                  className="card-in"
                  style={{ '--i': i }}
                  producto={producto}
                  onVerDetalle={setProductoSeleccionado}
                  onAgregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </Cuadricula>
          </>
        )}
      </Contenido>

      <PieTienda />

      {productoSeleccionado && (
        <ProductDetailModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          onAgregarAlCarrito={agregarAlCarrito}
          onVerProducto={setProductoSeleccionado}
          todosLosProductos={productos}
        />
      )}
    </Contenedor>
  );
};

export default Seccion;
