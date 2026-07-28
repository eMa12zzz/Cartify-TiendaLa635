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
import { useFilaDeslizable } from '../hooks/useFilaDeslizable';
import { useSeccionesTienda } from '../hooks/useSeccionesTienda';
import { useMyOrders } from '../hooks/useMyOrders';
import { useModulos } from '../hooks/useModulos';
import { iconoDeModulo } from '../utils/modulos';
// El <Toaster> global vive en App.jsx (uno solo, para que los avisos se cierren bien).

const BROWN = '#B46C30';
const BROWN_DARK = '#8A5222';
const BROWN_LIGHT = '#F3E7D8';

/* ─── Layout ─── */
const Container = styled.div`
  min-height: 100vh;
  background: var(--banda);
  font-family: var(--fuente);
`;

/* ─── Header ─── */
const Header = styled.header`
  background: white;
  padding: 0 28px;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 64px;
  position: sticky;
  top: 0;
  /* El sticky ya sirve de referencia para centrar el buscador dentro */
  z-index: 200;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex-shrink: 0;
`;

const LogoTop = styled.span`
  font-size: 11px;
  color: #aaa;
  line-height: 1;
`;

const LogoMain = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

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
              color var(--dur-press) var(--ease-out);

  &:hover {
    background: ${props => (props.$solida ? BROWN_DARK : 'var(--marca-50)')};
    border-color: ${props => (props.$solida ? BROWN_DARK : 'var(--marca-400)')};
    color: ${props => (props.$solida ? '#fff' : BROWN)};
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
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out);
  &:hover { background: ${BROWN_DARK}; border-color: ${BROWN_DARK}; }
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
  border-bottom: 1px solid var(--linea);
  height: 60px;
  align-items: center;
  &::-webkit-scrollbar { display: none; }

  /* Con muchas categorías deja de centrar y se vuelve deslizable. */
  @media (max-width: 900px) { justify-content: flex-start; }
`;

/*
 * ── Barra de pasillos ──
 * Un nivel por ENCIMA de las categorías: Abarrotes, Panadería, Pupusería son
 * partes de la misma tienda, no tiendas distintas. Por eso son pestañas y no
 * pastillas: si se vieran igual que las categorías, nadie entendería cuál
 * manda sobre cuál.
 */
const PasilloBar = styled.nav`
  /* Sin fondo propio: las barras se apoyan en el de la página en vez de
     cortarla con dos franjas blancas antes de que empiece el contenido. */
  background: transparent;
  padding: 0 28px;
  display: flex;
  justify-content: center;
  gap: 4px;
  overflow-x: auto;
  height: 52px;
  align-items: center;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 900px) { justify-content: flex-start; }
`;

const PasilloBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  height: 100%;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: ${props => (props.$active ? 700 : 500)};
  color: ${props => (props.$active ? BROWN : 'var(--tinta-suave)')};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
  transition: color var(--dur-press) var(--ease-out);

  &::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: ${props => (props.$active ? BROWN : 'transparent')};
    transition: background-color var(--dur-press) var(--ease-out);
  }

  &:hover { color: ${BROWN}; }
`;

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
  &:hover {
    border-color: ${BROWN};
    color: ${props => (props.$active ? '#fff' : BROWN)};
  }
`;

/* ─── Content ─── */
const Content = styled.div`
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
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
  gap: 10px;
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
  margin-top: 16px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding-left: 2px;
  padding-bottom: 4px;
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
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <Header>
        <LogoArea onClick={() => navigate('/tienda-dashboard')}>
          <LogoTop>Tienda</LogoTop>
          <LogoMain>la 635</LogoMain>
        </LogoArea>

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
            <Mic size={16} strokeWidth={2.2} /> Asistente
          </IconBtn>
          <CartBtn onClick={() => setMostrarCarrito(true)}>
            <ShoppingBag size={16} strokeWidth={2.2} /> Carrito
            {cantidadItems > 0 && <CartBadge>{cantidadItems}</CartBadge>}
          </CartBtn>
          <IconBtn onClick={() => navigate('/mi-cuenta')} title="Mi Cuenta"><User size={16} strokeWidth={2.2} /> Mi Cuenta</IconBtn>
          {/* Cerrar sesión vive solo en Mi Cuenta: acá era muy fácil apretarlo
              sin querer, al lado del carrito. */}
        </HeaderRight>
      </Header>

      {/*
        Los pasillos de la tienda. Solo aparecen si hay más de uno: con una
        sola estantería, la barra sería una pestaña sola sin nada que elegir.
      */}
      {pasillos.length > 1 && (
        <PasilloBar>
          <PasilloBtn $active={!moduloSeleccionado} onClick={() => setModuloSeleccionado(null)}>
            Toda la tienda
          </PasilloBtn>
          {pasillos.map((m) => {
            const Icono = iconoDeModulo(m);
            return (
              <PasilloBtn
                key={m._id}
                $active={String(moduloSeleccionado) === String(m._id)}
                onClick={() => setModuloSeleccionado(m._id)}
              >
                <Icono size={16} strokeWidth={2} />
                {m.name}
              </PasilloBtn>
            );
          })}
        </PasilloBar>
      )}

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