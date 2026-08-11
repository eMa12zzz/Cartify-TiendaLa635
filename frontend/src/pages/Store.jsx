import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../hooks/useStore';
import ProductCard from '../components/Store/ProductCard';
import ProductDetailModal from '../components/Store/ProductDetailModal';
import ShoppingCart from '../components/Store/ShoppingCart';
import AsistenteVoz from '../components/Store/AsistenteVoz';
import PromoBanners from '../components/Store/PromoBanners';
import PromoDetailModal from '../components/Store/PromoDetailModal';
import FilaProductos from '../components/Store/FilaProductos';
import HeaderTienda from '../components/Store/HeaderTienda';
import PieTienda from '../components/Store/PieTienda';
import { useFilaDeslizable } from '../hooks/useFilaDeslizable';
import { useSeccionesTienda } from '../hooks/useSeccionesTienda';
import { useMyOrders } from '../hooks/useMyOrders';
import { useModulos } from '../hooks/useModulos';
import { useAjustesCtx } from '../context/AjustesContext';
import { bloqueDeSeccion } from '../utils/portada';
// El <Toaster> global vive en App.jsx (uno solo, para que los avisos se cierren bien).

const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';
const BROWN_LIGHT = 'var(--marca-100)';

/* ─── Layout ─── */
const Container = styled.div`
  min-height: 100vh;
  /*
   * Fondo blanco. El beige de antes competía con las tarjetas —que también
   * son claras— y hacía ver la página como una hoja vieja; con blanco los
   * productos y las promociones son lo único con color.
   */
  background: #fff;
  font-family: var(--fuente);

  /*
   * Columna flex para que el pie se quede ABAJO cuando la página es corta.
   *
   * Con min-height: 100vh a secas, una búsqueda de cinco productos dejaba el
   * pie flotando a media pantalla y 259 píxeles de blanco debajo: la página
   * parecía cortada, como si le faltara algo por cargar. Ahora el contenido
   * empuja (flex: 1) y el pie aterriza en el borde de abajo aunque haya poco
   * que mostrar.
   */
  display: flex;
  flex-direction: column;
`;

/* Lo que crece para empujar el pie hasta abajo. */
const Cuerpo = styled.div`
  flex: 1;
`;

/* ─── Category Bar ─── */
/* En el diseño las categorías van CENTRADAS, no pegadas a la izquierda. */
const CategoryBar = styled.nav`
  background: transparent;
  padding: 0 28px;
  display: flex;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
  /*
   * Sin raya abajo. La única línea de la pantalla es la del encabezado, que
   * sí separa dos cosas distintas; esta partía la tienda en dos por gusto y
   * competía con el borde de las tarjetas de promoción que van justo abajo.
   */
  height: 60px;
  align-items: center;
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  /* Con muchas categorías deja de centrar y se vuelve deslizable. */
  @media (max-width: 900px) { justify-content: flex-start; }

  /*
   * Deslizable con el dedo, sin arrastrar la página con él: el que se corre es
   * ESTE renglón, no el cuerpo. El fundido de la orilla derecha es lo que
   * avisa que hay más categorías — sin él, "Snacks" cortado a filo se lee como
   * el final de la lista.
   */
  @media (max-width: 700px) {
    padding: 0 16px;
    height: 54px;
    scroll-padding-inline: 16px;
    mask-image: linear-gradient(to right, #000 calc(100% - 26px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 26px), transparent 100%);
  }
`;

/*
 * La barra de pasillos y sus estilos se eliminaron: los pasillos ahora se
 * eligen desde el menú del nombre de la tienda (MenuTienda). Tener las dos
 * cosas era decir lo mismo dos veces, y la barra empujaba los productos media
 * pantalla hacia abajo antes de que se viera un solo precio.
 */

/* Pill blanca con borde; la activa es café SÓLIDO con texto blanco. */
const CatBtn = styled.button`
  padding: 0 18px;
  height: 38px;
  border: 1px solid ${props => (props.$active ? BROWN : 'var(--linea)')};
  background: ${props => (props.$active ? BROWN : 'var(--papel)')};
  color: ${props => (props.$active ? '#fff' : 'var(--tinta-suave)')};
  font-weight: ${props => (props.$active ? 600 : 500)};
  border-radius: var(--radio-pill);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  flex-shrink: 0;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${BROWN};
      color: ${props => (props.$active ? '#fff' : BROWN)};
    }
  }
  &:active { transform: scale(0.97); }

  /* 44px de alto en pantalla táctil: el pulgar no apunta, aproxima. */
  @media (pointer: coarse), (max-width: 560px) { height: 44px; }
`;

/* ─── Content ─── */
const Content = styled.div`
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;

  /* Mismo margen lateral que el pie y que la pantalla de sección, para que al
     pasar de una a otra los productos no se corran de lugar. */
  @media (max-width: 560px) { padding: 20px 16px 32px; }
`;

/*
 * El carril de una fila de la portada.
 *
 * Mismo ancho y mismo margen lateral que <Content>, pero por bloque en vez de
 * envolverlos a todos: las promociones van de orilla a orilla —su carrusel
 * asoma las tarjetas de los lados— y ahora pueden ir en cualquier posición
 * del orden, así que ya no se puede meter todo en un solo contenedor con
 * relleno y dejar las promos fuera.
 */
const Franja = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 28px;

  @media (max-width: 560px) { padding: 0 16px; }
`;

/* El aire de arriba que antes ponía <Content>, ahora para el grupo entero. */
const Portada = styled.div`
  padding-top: 24px;

  @media (max-width: 560px) { padding-top: 20px; }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  gap: 12px;

  /* El título es largo ("Todo en Abarrotes") y Filtros no puede encogerse:
     arriba el nombre, abajo el botón, en vez de aplastarse mutuamente. */
  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

/* En el diseño los títulos de sección son grandes y pesados. */
const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--tinta);
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  min-width: 0;

  @media (max-width: 560px) { font-size: 21px; }
`;

/* Va pegada al título, así que no hereda su peso ni su tamaño. */
const SectionCount = styled.span`
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--tinta-tenue);
`;

/*
 * Flechas circulares a la derecha del título, como en el diseño. Por ahora
 * desplazan la fila de tarjetas; cuando la sección no se pueda mover más,
 * la flecha se apaga sola.
 */
const SectionNav = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const NavCircle = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--linea);
  background: var(--papel);
  color: var(--tinta);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out);
  &:hover:not(:disabled) { border-color: ${BROWN}; color: ${BROWN}; background: var(--marca-50); }
  &:disabled { opacity: 0.35; cursor: default; }
`;

/* ─── Filter bar with dropdown ─── */
/* Vive dentro del encabezado, así que ya no necesita empujarse ni separarse. */
const FilterBar = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  flex-shrink: 0;
`;

const FilterBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1.5px solid ${props => props.$open ? BROWN : '#e0e0e0'};
  background: ${props => props.$open ? BROWN_LIGHT : 'white'};
  color: ${props => props.$open ? BROWN : '#444'};
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);
  &:hover { border-color: ${BROWN}; color: ${BROWN}; background: ${BROWN_LIGHT}; }
`;

/* Dropdown panel – matches design exactly */
const FilterDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${BROWN};
  border-radius: 14px;
  padding: 16px 20px;
  z-index: 100;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
`;

const FilterDropTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const FilterOption = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: white;
  font-weight: ${props => props.$active ? '700' : '400'};
  text-align: left;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

const FilterToggle = styled.div`
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: ${props => props.$active ? 'white' : 'rgba(255,255,255,0.3)'};
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$active ? '17px' : '3px'};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$active ? BROWN : 'white'};
    transition: left 0.2s;
  }
`;

/* ─── Trending Section ─── */
/*
 * Sin tarjeta blanca alrededor: el recuadro partía la portada en cajas y se
 * sentía como secciones separadas en vez de una sola página. Ahora las filas
 * se distinguen por el aire entre ellas, no por un borde.
 */
const TrendingSection = styled.div`
  margin-bottom: 34px;
`;

const TrendingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TrendingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

/*
 * En el diseño esta fila NO es una grilla: se corre de lado con las flechas.
 * scroll-snap hace que siempre quede una tarjeta alineada al borde, sin cortes
 * a media tarjeta.
 */
const TrendingGrid = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding-left: 2px;

  /*
   * Aire arriba y abajo, comido con márgenes negativos.
   *
   * Un contenedor con overflow-x recorta también por ARRIBA y por ABAJO: el
   * navegador no deja tener un eje recortado y el otro suelto. Sin este
   * respiro, la tarjeta que crece al pasar el cursor se quedaba con la
   * sombra cortada a filo, como apoyada sobre una regla.
   *
   * Los márgenes negativos devuelven el espacio, así el aire existe para la
   * sombra pero la fila no se separa del resto de la página.
   */
  /*
   * El respiro sale de la sombra en hover, no de un numero al azar: la
   * tarjeta sube 4px y su sombra es 0 12px 32px, o sea que se derrama unos
   * 20px hacia arriba y unos 32px hacia abajo. Con menos que esto se corta
   * a filo, y el recorte lateral se comia la sombra de la primera y la
   * ultima tarjeta, que son las pegadas al borde del scroll.
   *
   * Los margenes negativos devuelven el espacio; el -4 de arriba conserva
   * los 16px de separacion con el titulo que tenia esta fila.
   */
  padding: 24px 16px 44px;
  margin: -8px -16px -40px;

  /*
   * Fundido en las orillas.
   *
   * El aire lateral resuelve la sombra de la primera y la última tarjeta,
   * pero se desplaza CON el contenido: apenas se hace scroll, la tarjeta que
   * va saliendo vuelve a cortarse a filo contra el borde. El degradado hace
   * que se desvanezca en vez de cortarse, y de paso avisa que hay más.
   *
   * El fundido mide lo mismo que el padding, así que en reposo cae sobre
   * espacio vacío y no toca la primera tarjeta.
   */
  mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);

  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  > * {
    flex: 0 0 clamp(160px, 21%, 214px);
    scroll-snap-align: start;
  }
`;

/* ─── Products Grid ─── */
const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 16px;

  /*
   * DOS columnas en el teléfono, no una.
   *
   * Con el mínimo en 195px no cabían dos (2×195+16 = 406 en 343 de ancho), así
   * que la cuadrícula caía a una sola columna y cada producto ocupaba la
   * pantalla entera: para ver seis había que bajar tres veces. Bajando el
   * mínimo a 150 entran dos, que es como se compara precio contra precio.
   */
  @media (max-width: 560px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 16px;
  .icon { font-size: 48px; margin-bottom: 12px; }
`;

/* ─── Component ─── */
const Store = () => {
  const navigate = useNavigate();
  /*
   * Si vino desde "Servicios" con ?modulo=, la tienda abre parada en ese
   * pasillo. Se lee una sola vez, al montar: después manda la barra de arriba.
   */
  const [searchParams] = useSearchParams();
  const { pasillos } = useModulos();
  // La tienda se ve con o sin cuenta; la sesión solo cambia qué botones salen.

  const {
    moduloSeleccionado,
    setModuloSeleccionado,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    terminoBusqueda,
    setTerminoBusqueda,
    productosFiltrados,
    productosDestacados,
    productos, // all products for recommendations
    productosDelPasillo,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    carrito,
    totalCarrito,
    cantidadItems,
    limpiarCarrito,
    filtroPrecio,
    setFiltroPrecio,
    promoSeleccionada,
    setPromoSeleccionada,
    promoDetalle,
    productosDePromo,
    abrirPromo,
    cerrarPromo,
    verPromoEnTienda,
  /*
   * El `q` lo manda el buscador del encabezado cuando se escribe desde una
   * pantalla que no maneja la búsqueda —Impresiones—. Así teclear algo allá
   * hace lo que uno espera: llegar a la tienda con eso ya buscado.
   */
  } = useStore({
    moduloInicial: searchParams.get('modulo'),
    busquedaInicial: searchParams.get('q') || '',
  });

  // Flechas de la fila de "Más vendidos" (se apagan solas en los extremos).
  const destacados = useFilaDeslizable();

  // Sus pedidos alimentan la fila "Volver a comprar"; si es cliente nuevo,
  // esa fila simplemente no se arma.
  const { orders } = useMyOrders();
  /*
   * Las secciones automáticas se arman con lo del pasillo, no con todo el
   * catálogo: estando en Librería, "Nuevos en la tienda" mostraba las papas
   * de abarrotes y el filtro parecía roto.
   */
  const secciones = useSeccionesTienda({ productos: productosDelPasillo, pedidos: orders });

  /*
   * El orden y la visibilidad de las filas los decide el panel. Ver
   * utils/portada.js y la pantalla de Personalización.
   */
  const { portadaVisible } = useAjustesCtx();

  /*
   * Las filas automáticas, agrupadas bajo el bloque que las gobierna. Los
   * estantes de familia ("Quesos", "Bebidas energizantes") caen todos bajo
   * 'familias': cuáles aparecen depende del inventario, así que se encienden
   * y se apagan juntos.
   */
  const seccionesPorBloque = useMemo(() => {
    const mapa = new Map();
    secciones.forEach((seccion) => {
      const bloque = bloqueDeSeccion(seccion.clave);
      if (!mapa.has(bloque)) mapa.set(bloque, []);
      mapa.get(bloque).push(seccion);
    });
    return mapa;
  }, [secciones]);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarAsistente, setMostrarAsistente] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAbrirDetalle = (producto) => setProductoSeleccionado(producto);
  const handleCerrarDetalle = () => setProductoSeleccionado(null);

  const precioFiltros = [
    { key: 'todos', label: 'Todos' },
    { key: '0-4', label: '$4 - 12$' },
    { key: '4-12', label: '$4 - 12$' },
    { key: '12+', label: 'Arriba de $4' },
  ];

  // Display labels matching design
  const filterLabels = {
    'todos': 'Todos',
    '0-4': '$4 - 12$',
    '4-12': '$4 - 12$',
    '12+': 'Arriba de $4',
  };

  const showTrending = !categoriaSeleccionada && !terminoBusqueda && !promoSeleccionada;

  // Nombre del pasillo donde está parado el cliente, para los títulos y avisos.
  const nombrePasillo = pasillos.find((m) => String(m._id) === String(moduloSeleccionado))?.name || '';

  return (
    <Container>

      {/* Overlay del Asistente por Voz (Modo Kiosco) — con entrada/salida suave */}
      <AnimatePresence>
        {mostrarAsistente && (
          <AsistenteVoz
            key="asistente-voz"
            onClose={() => setMostrarAsistente(false)}
            productos={productos}
            agregarAlCarrito={agregarAlCarrito}
            eliminarDelCarrito={eliminarDelCarrito}
            actualizarCantidad={actualizarCantidad}
            limpiarCarrito={limpiarCarrito}
            carrito={carrito}
            totalCarrito={totalCarrito}
            /*
              A dónde puede llevar la voz. La tienda es la que sabe abrir un
              producto o cambiar de pasillo sin recargar la página, así que
              el asistente pide y ella mueve.
            */
            categorias={categorias}
            irAProducto={handleAbrirDetalle}
            irACategoria={(cat) => {
              setCategoriaSeleccionada(cat);
              // Que el pasillo elegido quede a la vista: si la persona está
              // abajo mirando otra fila, cambiar el filtro sin subir no se
              // nota y parece que el asistente no hizo nada.
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            irARuta={(ruta) => navigate(ruta)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ──
          Es el mismo componente que usa Impresiones. Vivía escrito aquí
          adentro, y por eso Impresiones había terminado con una barra propia
          de dos botones, sin pasillos ni carrito. Ver HeaderTienda. */}
      <HeaderTienda
        moduloSeleccionado={moduloSeleccionado}
        onElegirModulo={setModuloSeleccionado}
        terminoBusqueda={terminoBusqueda}
        onBuscar={setTerminoBusqueda}
        cantidadItems={cantidadItems}
        onAbrirCarrito={() => setMostrarCarrito(true)}
        onAbrirAsistente={() => setMostrarAsistente(true)}
      />

      {/*
        La barra de pasillos se fue: ahora los pasillos viven en el menú del
        nombre de la tienda. Tener las dos era decir lo mismo dos veces y
        empujaba los productos media pantalla hacia abajo.
      */}

      {/* Todo lo que va entre el encabezado y el pie: es lo que crece y empuja
          el pie hasta abajo cuando hay pocos productos que mostrar. */}
      <Cuerpo>

      {/* ── Category Bar ── */}
      <CategoryBar>
        <CatBtn $active={!categoriaSeleccionada} onClick={() => setCategoriaSeleccionada(null)}>
          Todos
        </CatBtn>
        {categorias.map(cat => (
          <CatBtn
            key={cat}
            $active={categoriaSeleccionada === cat}
            onClick={() => setCategoriaSeleccionada(cat)}
          >
            {cat}
          </CatBtn>
        ))}
      </CategoryBar>

      {/* Chip para limpiar el filtro de promo */}
      {promoSeleccionada && (
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--marca-600)', fontWeight: 600 }}>
            Promo: {promoSeleccionada.title || promoSeleccionada.promoDescription}
          </span>
          <button
            onClick={() => setPromoSeleccionada(null)}
            style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 13, cursor: 'pointer', color: '#444' }}
          >
            ✕ Ver todos
          </button>
        </div>
      )}

      {/*
        ── La portada, en el orden que decidió el panel ──

        Antes esto era una secuencia fija escrita aquí: promociones, más
        vendidos, y después las filas automáticas. Ahora el orden y qué se
        muestra salen de los ajustes de la tienda, porque no todas las tiendas
        se ven igual: una que vende casi solo abarrotes quiere "Volver a
        comprar" de primero, y una que estrena catálogo quiere "Nuevos".

        Lo que NO cambió: el contenido de cada fila lo sigue armando el
        sistema con el inventario. Aquí se acomodan bloques, no se eligen
        productos a mano. Ver utils/portada.js.
      */}
      {showTrending && (
        <Portada>
          {portadaVisible.map((bloque) => {
            if (bloque.clave === 'promos') {
              // De orilla a orilla y sin carril: su carrusel asoma las
              // tarjetas de los lados y con relleno se le cortarían.
              return <PromoBanners key={bloque.clave} onSelectPromo={abrirPromo} />;
            }

            if (bloque.clave === 'mas-vendidos') {
              if (productosDestacados.length === 0) return null;
              return (
                <Franja key={bloque.clave}>
                  <TrendingSection>
                    <TrendingHeader>
                      <TrendingBadge>
                        <LiveDot />
                        <SectionTitle>Más vendidos</SectionTitle>
                      </TrendingBadge>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <SectionCount>{productosDestacados.length} productos</SectionCount>
                        <SectionNav>
                          <NavCircle onClick={destacados.izquierda} disabled={!destacados.puedeIzq} aria-label="Ver anteriores">
                            <ChevronLeft size={19} strokeWidth={2.2} />
                          </NavCircle>
                          <NavCircle onClick={destacados.derecha} disabled={!destacados.puedeDer} aria-label="Ver siguientes">
                            <ChevronRight size={19} strokeWidth={2.2} />
                          </NavCircle>
                        </SectionNav>
                      </div>
                    </TrendingHeader>
                    <TrendingGrid ref={destacados.fila}>
                      {productosDestacados.map(producto => (
                        <ProductCard
                          key={producto.id}
                          producto={producto}
                          onVerDetalle={handleAbrirDetalle}
                          onAgregarAlCarrito={agregarAlCarrito}
                        />
                      ))}
                    </TrendingGrid>
                  </TrendingSection>
                </Franja>
              );
            }

            /*
              El resto son filas que se arman solas con el inventario:
              "Volver a comprar", "Se están acabando", "Nuevos" y los estantes
              de familia (Quesos, Leches...). Si en este momento no hay datos
              para armarla —un cliente nuevo no tiene qué volver a comprar—,
              simplemente no se pinta.
            */
            const delBloque = seccionesPorBloque.get(bloque.clave) || [];
            if (delBloque.length === 0) return null;

            return (
              <Franja key={bloque.clave}>
                {delBloque.map((seccion) => (
                  <FilaProductos
                    key={seccion.clave}
                    titulo={seccion.titulo}
                    subtitulo={seccion.subtitulo}
                    productos={seccion.productos}
                    total={seccion.todos?.length}
                    // El nombre de la sección y "Ver todos" abren la misma
                    // pantalla: son dos puertas a lo mismo.
                    onVerTodos={() => navigate(`/seccion/${seccion.clave}`)}
                    onVerDetalle={handleAbrirDetalle}
                    onAgregarAlCarrito={agregarAlCarrito}
                  />
                ))}
              </Franja>
            );
          })}
        </Portada>
      )}

      <Content>
        {/* ── All / Filtered Products ──
            El catálogo completo NO es un bloque configurable: es la tienda en
            sí. Siempre va al final y siempre está. */}
        <div>
          {/*
            Título, cantidad y Filtros en UNA sola línea. Antes la cantidad se
            iba al extremo derecho y el botón caía debajo, así que el encabezado
            ocupaba dos renglones y quedaba desalineado.
          */}
          <SectionHeader>
            <SectionTitle>
              {categoriaSeleccionada || terminoBusqueda
                ? (categoriaSeleccionada || `"${terminoBusqueda}"`)
                : (nombrePasillo ? `Todo en ${nombrePasillo}` : 'Todos los productos')}
              <SectionCount>{productosFiltrados.length} productos</SectionCount>
            </SectionTitle>

            <FilterBar ref={filterRef}>
              <FilterBtn $open={filterOpen} onClick={() => setFilterOpen(o => !o)}>
                <SlidersHorizontal size={15} strokeWidth={2.2} /> Filtros
              </FilterBtn>

              {filterOpen && (
                <FilterDropdown>
                  <FilterDropTitle>Precio</FilterDropTitle>
                  {precioFiltros.map(f => (
                    <FilterOption
                      key={f.key}
                      $active={filtroPrecio === f.key}
                      onClick={() => { setFiltroPrecio(f.key); setFilterOpen(false); }}
                    >
                      <FilterToggle $active={filtroPrecio === f.key} />
                      {f.label}
                    </FilterOption>
                  ))}
                </FilterDropdown>
              )}
            </FilterBar>
          </SectionHeader>

          {productosFiltrados.length === 0 ? (
            <EmptyState>
              <div className="icon"><Search size={34} strokeWidth={1.6} /></div>
              {/*
                Un pasillo recién creado está vacío hasta que le carguen
                productos. Decir 'No hay productos para ""' hacía parecer que
                la tienda estaba rota.
              */}
              {terminoBusqueda || categoriaSeleccionada
                ? `No hay productos para "${terminoBusqueda || categoriaSeleccionada}"`
                : nombrePasillo
                  ? `${nombrePasillo} todavía no tiene productos`
                  : 'Todavía no hay productos en la tienda'}
            </EmptyState>
          ) : (
            <ProductsGrid>
              {productosFiltrados.map((producto, i) => (
                <ProductCard
                  key={producto.id}
                  className="card-in"
                  style={{ '--i': i }}
                  producto={producto}
                  onVerDetalle={handleAbrirDetalle}
                  onAgregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </ProductsGrid>
          )}
        </div>
      </Content>

      </Cuerpo>

      {/* El cierre de la página: sin esto los productos se acababan y quedaba
          el blanco, como si la tienda se hubiera cortado a medias. */}
      <PieTienda />

      {/* ── Modals ── */}
      {/*
        Detalle de la promo. Se abre con la misma animación que un producto,
        así el click al banner se siente igual de vivo que el click a una
        tarjeta; antes solo filtraba la lista de abajo, sin aviso.
      */}
      {promoDetalle && (
        <PromoDetailModal
          promo={promoDetalle}
          productos={productosDePromo}
          onCerrar={cerrarPromo}
          onVerEnTienda={() => verPromoEnTienda(promoDetalle)}
          onVerProducto={handleAbrirDetalle}
          onAgregarAlCarrito={agregarAlCarrito}
        />
      )}

      {productoSeleccionado && (
        <ProductDetailModal
          producto={productoSeleccionado}
          onClose={handleCerrarDetalle}
          onAgregarAlCarrito={agregarAlCarrito}
          // Click en una recomendación: cambia el producto del mismo modal.
          onVerProducto={handleAbrirDetalle}
          todosLosProductos={productosDelPasillo?.length ? productosDelPasillo : productos}
        />
      )}

      {mostrarCarrito && (
        <ShoppingCart
          items={carrito}
          total={totalCarrito}
          onCerrar={() => setMostrarCarrito(false)}
          onActualizarCantidad={actualizarCantidad}
          onEliminarItem={eliminarDelCarrito}
          onLimpiarCarrito={limpiarCarrito}
          onCheckout={() => {
            limpiarCarrito();
            setMostrarCarrito(false);
          }}
        />
      )}
    </Container>
  );
};

export default Store;