import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, Mic, ShoppingBag, User, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import styled from 'styled-components';
import { useStore } from '../hooks/useStore';
import ProductCard from '../components/Store/ProductCard';
import ProductDetailModal from '../components/Store/ProductDetailModal';
import ShoppingCart from '../components/Store/ShoppingCart';
import AsistenteVoz from '../components/Store/AsistenteVoz';
import PromoBanners from '../components/Store/PromoBanners';
import PromoDetailModal from '../components/Store/PromoDetailModal';
import FilaProductos from '../components/Store/FilaProductos';
import SelectorDireccion from '../components/Store/SelectorDireccion';
import MenuTienda from '../components/Store/MenuTienda';
import PieTienda from '../components/Store/PieTienda';
import { useFilaDeslizable } from '../hooks/useFilaDeslizable';
import { useSeccionesTienda } from '../hooks/useSeccionesTienda';
import { useMyOrders } from '../hooks/useMyOrders';
import { useModulos } from '../hooks/useModulos';
import { useAuth } from '../hooks/useAuth';
// El <Toaster> global vive en App.jsx (uno solo, para que los avisos se cierren bien).

const BROWN = '#B46C30';
const BROWN_DARK = '#8A5222';
const BROWN_LIGHT = '#F3E7D8';

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
`;

/* ─── Header ─── */
const Header = styled.header`
  background: white;
  padding: 0 28px;
  /*
   * La raya que separa el navbar de la tienda. Antes el header era blanco
   * sobre un fondo beige y el contraste ya los separaba solo; ahora que todo
   * es blanco, sin esta línea el encabezado flota sin principio ni fin.
   */
  border-bottom: 1px solid #e6e2dd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 64px;
  position: sticky;
  top: 0;
  /* El sticky ya sirve de referencia para centrar el buscador dentro */
  z-index: 200;

  /*
   * En teléfono el encabezado pasa a DOS renglones.
   *
   * Todo esto —nombre, dirección, buscador, asistente, carrito y cuenta— nunca
   * cupo en una sola fila de 375px: el buscador tiene flex:1 y min-width:0, así
   * que era él quien cedía, y terminaba midiendo 14 píxeles mientras los
   * botones se salían 181px fuera de la pantalla.
   *
   * Se parte donde menos duele: arriba quedan el nombre y los botones (que se
   * reconocen por su icono), y el buscador se lleva un renglón entero para él
   * solo. En una tienda de barrio la gente no navega pasillos, viene por algo
   * concreto y lo escribe — ese renglón es el que más se usa de la pantalla.
   */
  @media (max-width: 700px) {
    height: auto;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
    padding: 8px 16px 10px;
  }
`;

/* El nombre de la tienda y sus estilos se mudaron a MenuTienda: ahora abre
   los pasillos en vez de navegar a Servicios. */

/*
 * Buscador del diseño: pill blanca con borde suave y el icono metido en un
 * círculo café a la izquierda (antes era gris con una lupa suelta).
 */
const SearchBox = styled.div`
  /*
   * Centrado de verdad: el buscador queda a la misma distancia del logo que
   * de los botones de la derecha. Antes tenía flex:1 a secas y se recostaba
   * contra el logo, dejando un hueco raro antes del carrito.
   *
   * Los márgenes automáticos lo centran respecto al header completo, sin
   * depender de que el logo y los botones midan lo mismo.
   */
  /*
   * Crece con la ventana pero hasta un tope, y dentro de su espacio se centra.
   *
   * Los dos extremos se probaron y ninguno sirve: centrado exacto contra el
   * header se monta encima del carrito (el logo mide 56px y los botones casi
   * 400), y estirado sin tope se vuelve una barra descomunal en pantalla
   * grande. Con max-width + márgenes automáticos queda centrado entre el logo
   * y los botones, que es donde el ojo lo espera.
   */
  flex: 1;
  min-width: 0;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: var(--papel);
  border: 1px solid var(--linea);
  border-radius: var(--radio-pill);
  padding: 0 6px 0 6px;
  gap: 10px;
  height: 46px;
  transition: box-shadow var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out);

  &:focus-within {
    border-color: ${BROWN};
    box-shadow: 0 0 0 3px ${BROWN}1F;
  }

  /*
   * El renglón de abajo, completo. El order lo manda después de los botones
   * aunque en el código venga antes: en el HTML el buscador va en medio porque
   * ahí es donde se lee en pantalla grande, y no vale la pena mover el marcado
   * —y con él el orden del tabulador— solo para acomodar el teléfono.
   */
  @media (max-width: 700px) {
    order: 3;
    flex-basis: 100%;
    max-width: none;
    margin: 0;
    height: 44px;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: var(--tinta);
    &::placeholder { color: var(--tinta-tenue); }
  }
`;

/* El círculo café que envuelve la lupa. */
const SearchIcon = styled.span`
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${BROWN};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  /* Pegados a la derecha una vez que el buscador se bajó de renglón. */
  @media (max-width: 700px) {
    margin-left: auto;
    gap: 6px;
  }
`;

/*
 * El texto de los botones del encabezado.
 *
 * En pantalla angosta se oculta pero NO se borra: queda escondido a la vista y
 * disponible para el lector de pantalla, así el botón sigue llamándose
 * "Carrito" para quien no lo ve. Con display:none se habría quedado mudo.
 */
const Etiqueta = styled.span`
  @media (max-width: 900px) {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
`;

/*
 * En el diseño TODO en el header son pills. Hay dos sabores:
 *   - $solida : café relleno con texto blanco (el Asistente).
 *   - normal  : blanca con borde (Mi Cuenta, salir).
 */
const IconBtn = styled.button`
  background: ${props => (props.$solida ? BROWN : 'var(--papel)')};
  border: 1px solid ${props => (props.$solida ? BROWN : 'var(--linea)')};
  color: ${props => (props.$solida ? '#fff' : 'var(--tinta-suave)')};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  height: 42px;
  border-radius: var(--radio-pill);
  font-size: 14px;
  font-weight: ${props => (props.$solida ? 600 : 500)};
  font-family: inherit;
  white-space: nowrap;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  /* En táctil un toque deja el hover pegado, así que el hover es solo del ratón. */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${props => (props.$solida ? BROWN_DARK : 'var(--marca-50)')};
      border-color: ${props => (props.$solida ? BROWN_DARK : 'var(--marca-400)')};
      color: ${props => (props.$solida ? '#fff' : BROWN)};
    }
  }
  &:active { transform: scale(0.97); }

  /*
   * Sin texto, cuadrado y de 44px: el mínimo con el que un pulgar acierta sin
   * pensarlo. Entre los clientes de la tienda hay gente mayor, y un botón de
   * 32px al lado de otro es una trampa.
   */
  @media (max-width: 900px) {
    width: 44px;
    height: 44px;
    padding: 0;
    justify-content: center;
    gap: 0;
  }
`;

const CartBtn = styled.button`
  background: ${BROWN};
  color: white;
  border: 1px solid ${BROWN};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  height: 42px;
  border-radius: var(--radio-pill);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  transition: background-color var(--dur-press) var(--ease-out),
              border-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: ${BROWN_DARK}; border-color: ${BROWN_DARK}; }
  }
  &:active { transform: scale(0.97); }

  /*
   * El carrito es lo único que conserva ancho propio al encogerse: lleva el
   * número de artículos al lado del icono, y ese número es media razón por la
   * que la gente mira el botón.
   */
  @media (max-width: 900px) {
    height: 44px;
    padding: 0 12px;
    gap: 6px;
  }
`;

const CartBadge = styled.span`
  background: white;
  color: ${BROWN};
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  padding: 0 4px;
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
  const { isAuthenticated } = useAuth();

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
  } = useStore({ moduloInicial: searchParams.get('modulo') });

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

      {/* ── Header ── */}
      <Header>
        {/*
          El nombre de la tienda abre sus pasillos en vez de mandar a otra
          pantalla: se elige el módulo sin perder de vista lo que se estaba
          comprando.
        */}
        <MenuTienda
          moduloSeleccionado={moduloSeleccionado}
          onElegirModulo={setModuloSeleccionado}
        />

        {/* A dónde le llevamos el pedido, cambiable sin salir de comprar */}
        <SelectorDireccion />

        <SearchBox>
          <SearchIcon><Search size={17} strokeWidth={2.4} /></SearchIcon>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
          {terminoBusqueda && (
            <button
              onClick={() => setTerminoBusqueda('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}
            >✕</button>
          )}
        </SearchBox>

        <HeaderRight>
          <IconBtn $solida onClick={() => setMostrarAsistente(true)} title="Asistente por voz">
            <Mic size={18} strokeWidth={2.2} /> <Etiqueta>Asistente</Etiqueta>
          </IconBtn>
          <CartBtn onClick={() => setMostrarCarrito(true)} title="Carrito">
            <ShoppingBag size={18} strokeWidth={2.2} /> <Etiqueta>Carrito</Etiqueta>
            {cantidadItems > 0 && <CartBadge>{cantidadItems}</CartBadge>}
          </CartBtn>
          {/*
            Sin sesión el botón invita a entrar; con sesión lleva a su cuenta.
            La tienda se puede ver sin cuenta, así que "Mi Cuenta" a alguien
            que no tiene ninguna sería una puerta a un cuarto que no existe.
          */}
          {isAuthenticated ? (
            <IconBtn onClick={() => navigate('/mi-cuenta')} title="Mi Cuenta">
              <User size={18} strokeWidth={2.2} /> <Etiqueta>Mi Cuenta</Etiqueta>
            </IconBtn>
          ) : (
            <IconBtn onClick={() => navigate('/iniciar-sesion?volver=/')} title="Iniciar sesión">
              <User size={18} strokeWidth={2.2} /> <Etiqueta>Ingresar</Etiqueta>
            </IconBtn>
          )}
          {/* Cerrar sesión vive solo en Mi Cuenta: acá era muy fácil apretarlo
              sin querer, al lado del carrito. */}
        </HeaderRight>
      </Header>

      {/*
        La barra de pasillos se fue: ahora los pasillos viven en el menú del
        nombre de la tienda. Tener las dos era decir lo mismo dos veces y
        empujaba los productos media pantalla hacia abajo.
      */}

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
          <span style={{ fontSize: 14, color: '#B46C30', fontWeight: 600 }}>
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
        Promociones reales de la tienda, en el lugar que ocupaban los tres
        banners de adorno. Aquellos apuntaban a categorías inventadas (Frutas,
        Lácteos, Snacks) que no existen en la base, así que no llevaban a
        ningún lado; estas sí filtran a sus productos.
      */}
      {showTrending && <PromoBanners onSelectPromo={abrirPromo} />}

      <Content>
        {/* ── Trending ── */}
        {showTrending && productosDestacados.length > 0 && (
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
        )}

        {/*
          Secciones que se arman solas con lo que hay en el inventario:
          "Volver a comprar", "Se están acabando", "Nuevos" y las familias que
          se detectan por el nombre (Quesos, Leches...). Nadie las configura.
        */}
        {showTrending && secciones.map((seccion) => (
          <FilaProductos
            key={seccion.clave}
            titulo={seccion.titulo}
            subtitulo={seccion.subtitulo}
            productos={seccion.productos}
            total={seccion.todos?.length}
            // El nombre de la sección y "Ver todos" abren la misma pantalla:
            // son dos puertas a lo mismo, no dos cosas distintas.
            onVerTodos={() => navigate(`/seccion/${seccion.clave}`)}
            onVerDetalle={handleAbrirDetalle}
            onAgregarAlCarrito={agregarAlCarrito}
          />
        ))}

        {/* ── All / Filtered Products ── */}
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