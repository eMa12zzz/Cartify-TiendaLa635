import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Store, ArrowRight, MapPin, MessageCircle, ShoppingBag,
  Wallet, ChevronDown, User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAjustesCtx } from '../context/AjustesContext';
import { useModulos } from '../hooks/useModulos';
import { iconoDeModulo, flujoDeModulo } from '../utils/modulos';
import { enlaceWhatsApp } from '../utils/tienda';
import PieTienda from '../components/Store/PieTienda';

/*
 * ============================================================
 * INICIO — la portada institucional, antes de entrar a comprar
 * ============================================================
 * Vive en "/" (y también en "/inicio"): es la primera puerta. El catálogo de
 * productos se movió a "/store" para dejarle este lugar — cuenta qué es
 * "Tienda la 635" antes de mandar a alguien directo a comprar, sin pedir
 * sesión en ningún momento. Ver App.jsx.
 *
 * Todo lo que aparece sale de datos reales (ajustes de la tienda, los
 * pasillos creados en el panel): nada de horarios, redes o reseñas
 * inventadas. Ver utils/tienda.js.
 * ============================================================
 */

const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';

const Pagina = styled.div`
  background: #fff;
  font-family: var(--fuente);
`;

/* ─── Encabezado ─── */
const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--linea);
  padding: 0 28px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 700px) { padding: 0 16px; height: 60px; }
`;

const Marca = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`;

/*
 * El mismo logo que en el encabezado de la tienda real (MenuTienda.jsx): se
 * limita por ALTURA y no por ancho, y sin logo se cae al nombre en dos
 * líneas apiladas — nada de ícono inventado, para que la marca se vea igual
 * en la portada y adentro comprando.
 */
const LogoImg = styled.img`
  height: 38px;
  width: auto;
  max-width: 168px;
  object-fit: contain;
  display: block;

  @media (max-width: 700px) { height: 31px; max-width: 124px; }
`;

const NombreMarca = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
`;

const LineaMarca = styled.span`
  font-size: 19px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;

  @media (max-width: 700px) { font-size: 15.5px; }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 800px) { display: none; }
`;

const EnlaceNav = styled.button`
  background: none;
  border: none;
  padding: 8px 14px;
  border-radius: var(--radio-pill);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--tinta-suave);
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: var(--marca-50); color: ${BROWN_DARK}; }
  }
`;

const Derecha = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EnlaceIngresar = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--tinta-suave);
  cursor: pointer;

  @media (hover: hover) and (pointer: fine) { &:hover { color: ${BROWN_DARK}; } }
  @media (max-width: 560px) { display: none; }
`;

const BotonEntrar = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 42px;
  border-radius: var(--radio-pill);
  border: none;
  background: ${BROWN};
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) { &:hover { background: ${BROWN_DARK}; } }
  &:active { transform: scale(0.97); }
`;

/* ─── Hero ─── */
/*
 * Sin foto: la tienda no tiene banco de imágenes propio, y una de stock
 * genérica se ve más falsa que un fondo de marca bien resuelto. El degradado
 * y los círculos usan los mismos cafés de la app.
 */
const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, ${BROWN_DARK} 0%, ${BROWN} 55%, #C9803F 100%);
  padding: 96px 28px 110px;
  text-align: center;

  @media (max-width: 700px) { padding: 64px 20px 80px; }
`;

const Mancha = styled.div`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
`;

const HeroContenido = styled.div`
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 7px 16px;
  border-radius: var(--radio-pill);
  margin-bottom: 22px;
`;

const HeroTitulo = styled.h1`
  font-size: clamp(32px, 5.5vw, 54px);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 18px;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
`;

const HeroBajada = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.92);
  max-width: 52ch;
  margin: 0 auto 36px;
`;

const HeroBotones = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const BotonHeroPrimario = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 26px;
  height: 52px;
  border-radius: var(--radio-pill);
  border: none;
  background: #fff;
  color: ${BROWN_DARK};
  font-family: inherit;
  font-size: 15.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.2);
  transition: transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) { &:hover { transform: translateY(-2px); } }
  &:active { transform: scale(0.97); }
`;

const BotonHeroSecundario = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  height: 52px;
  border-radius: var(--radio-pill);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 15.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) { &:hover { background: rgba(255, 255, 255, 0.12); } }
  &:active { transform: scale(0.97); }
`;

/* ─── Secciones generales ─── */
const Seccion = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 88px 28px;

  @media (max-width: 700px) { padding: 56px 20px; }
`;

const Encabezado = styled.div`
  text-align: center;
  max-width: 620px;
  margin: 0 auto 48px;
`;

const Etiqueta = styled.p`
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: ${BROWN};
  margin: 0 0 10px;
`;

const TituloSeccion = styled.h2`
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 800;
  color: var(--tinta);
  margin: 0 0 12px;
`;

const BajadaSeccion = styled.p`
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--tinta-suave);
  margin: 0;
`;

/* ─── Pasillos ─── */
const GrillaPasillos = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 20px;
`;

const TarjetaPasillo = styled.button`
  text-align: left;
  background: var(--papel);
  border: 1px solid var(--linea);
  border-radius: var(--radio-panel);
  padding: 26px 22px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${BROWN};
      box-shadow: var(--sombra-flotante);
      transform: translateY(-3px);
    }
  }
`;

const IconoPasillo = styled.span`
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--marca-100);
  color: ${BROWN_DARK};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const NombrePasillo = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: var(--tinta);
  margin: 0 0 6px;
`;

const DescPasillo = styled.p`
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--tinta-suave);
  margin: 0;
`;

const SinPasillos = styled.p`
  text-align: center;
  color: var(--tinta-tenue);
  font-size: 14px;
`;

/* ─── Cómo funciona ─── */
const FranjaClara = styled.div`
  background: var(--marca-50);
`;

const GrillaPasos = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 32px;
`;

const Paso = styled.div`
  text-align: center;
`;

const NumeroPaso = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${BROWN};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  box-shadow: var(--sombra-flotante);
`;

const TituloPaso = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: var(--tinta);
  margin: 0 0 8px;
`;

const DescPaso = styled.p`
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--tinta-suave);
  margin: 0;
  max-width: 30ch;
  margin: 0 auto;
`;

/* ─── Ubicación ─── */
const TarjetaUbicacion = styled.div`
  max-width: 560px;
  margin: 0 auto;
  background: var(--papel);
  border: 1px solid var(--linea);
  border-radius: var(--radio-panel);
  padding: 32px;
  text-align: center;
  box-shadow: var(--sombra-tarjeta);
`;

const PinGrande = styled.span`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--marca-100);
  color: ${BROWN_DARK};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  transition: background-color var(--dur-press) var(--ease-out);
`;

// Envuelve el pin y la dirección: al apretar cualquiera de los dos abre Google
// Maps. Sin subrayado propio de enlace, para que se sienta parte de la
// tarjeta y no un link suelto en medio del texto.
const EnlaceMapa = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;

  @media (hover: hover) and (pointer: fine) {
    &:hover ${PinGrande} { background: var(--marca-400); color: #fff; }
  }
`;

const Direccion = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: var(--tinta);
  margin: 0 0 22px;
`;

const Acciones = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const BotonMapa = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 22px;
  height: 46px;
  border-radius: var(--radio-pill);
  background: ${BROWN};
  border: 1px solid ${BROWN};
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  transition: background-color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) { &:hover { background: ${BROWN_DARK}; } }
`;

const BotonWhats = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 22px;
  height: 46px;
  border-radius: var(--radio-pill);
  background: #fff;
  border: 1px solid var(--linea);
  color: var(--tinta);
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  transition: border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) { &:hover { border-color: ${BROWN}; color: ${BROWN_DARK}; } }
`;

/* ─── CTA final ─── */
const CTAFinal = styled.section`
  background: linear-gradient(135deg, ${BROWN_DARK}, ${BROWN});
  padding: 72px 28px;
  text-align: center;
`;

const TituloCTA = styled.h2`
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 800;
  color: #fff;
  margin: 0 0 26px;
`;

const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const Inicio = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { ajustes } = useAjustesCtx();
  const { modulos, cargando } = useModulos();

  const whatsapp = enlaceWhatsApp('Hola, vengo de la página de inicio y quisiera hacer una consulta.');

  /*
   * No guardamos coordenadas propias de la tienda —solo la dirección
   * escrita—, así que se manda a Google Maps a buscar esa dirección en vez de
   * inventar un lat/lng. Se le suma el país: sin él, Google a veces geolocaliza
   * una calle con el mismo nombre en otro lugar del mundo.
   */
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ajustes.direccion}, El Salvador`)}`;

  const entrar = () => navigate('/store');

  // Misma regla que en el pie de la tienda: cada pasillo lleva al catálogo
  // filtrado en ese pasillo, salvo Impresiones, que tiene pantalla propia.
  const irAlPasillo = (m) => {
    navigate(flujoDeModulo(m) === 'impresiones' ? '/impresiones' : `/store?modulo=${encodeURIComponent(m._id)}`);
  };

  return (
    <Pagina>
      <Header>
        <Marca onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          {ajustes.logoUrl ? (
            <LogoImg src={ajustes.logoUrl} alt={`${ajustes.nombreLinea1} ${ajustes.nombreLinea2}`.trim()} />
          ) : (
            <NombreMarca>
              <LineaMarca>{ajustes.nombreLinea1}</LineaMarca>
              {ajustes.nombreLinea2 && <LineaMarca>{ajustes.nombreLinea2}</LineaMarca>}
            </NombreMarca>
          )}
        </Marca>

        <Nav>
          <EnlaceNav onClick={() => irA('pasillos')}>Pasillos</EnlaceNav>
          <EnlaceNav onClick={() => irA('como-funciona')}>Cómo funciona</EnlaceNav>
          <EnlaceNav onClick={() => irA('ubicacion')}>Ubicación</EnlaceNav>
        </Nav>

        <Derecha>
          <EnlaceIngresar onClick={() => navigate(isAuthenticated ? '/mi-cuenta' : '/iniciar-sesion')}>
            <User size={16} strokeWidth={2.2} /> {isAuthenticated ? 'Mi cuenta' : 'Ingresar'}
          </EnlaceIngresar>
          <BotonEntrar onClick={entrar}>
            <ShoppingBag size={17} strokeWidth={2.3} /> Entrar a la tienda
          </BotonEntrar>
        </Derecha>
      </Header>

      <Hero>
        <Mancha style={{ width: 340, height: 340, top: -140, left: -100 }} />
        <Mancha style={{ width: 260, height: 260, bottom: -120, right: -60 }} />

        <HeroContenido>
          <Eyebrow><Store size={14} strokeWidth={2.4} /> {ajustes.nombreLinea1} {ajustes.nombreLinea2}</Eyebrow>
          <HeroTitulo>La mejor tienda de la colonia</HeroTitulo>
          <HeroBajada>{ajustes.lema}</HeroBajada>
          <HeroBotones>
            <BotonHeroPrimario onClick={entrar}>
              Entrar a la tienda <ArrowRight size={18} strokeWidth={2.4} />
            </BotonHeroPrimario>
            <BotonHeroSecundario onClick={() => irA('pasillos')}>
              Ver pasillos <ChevronDown size={17} strokeWidth={2.4} />
            </BotonHeroSecundario>
          </HeroBotones>
        </HeroContenido>
      </Hero>

      <Seccion id="pasillos">
        <Encabezado>
          <Etiqueta>Qué encuentra</Etiqueta>
          <TituloSeccion>Nuestros pasillos</TituloSeccion>
          <BajadaSeccion>Todo se compra en el mismo carrito, sin cambiar de tienda.</BajadaSeccion>
        </Encabezado>

        {!cargando && modulos.length === 0 && (
          <SinPasillos>Muy pronto vamos a mostrar aquí lo que se puede comprar.</SinPasillos>
        )}

        <GrillaPasillos>
          {modulos.map((m, i) => {
            const Icono = iconoDeModulo(m);
            return (
              <TarjetaPasillo
                key={m._id}
                style={{ '--i': i }}
                className="card-in"
                onClick={() => irAlPasillo(m)}
              >
                <IconoPasillo><Icono size={22} strokeWidth={2} /></IconoPasillo>
                <NombrePasillo>{m.name}</NombrePasillo>
                {m.description && <DescPasillo>{m.description}</DescPasillo>}
              </TarjetaPasillo>
            );
          })}
        </GrillaPasillos>
      </Seccion>

      <FranjaClara id="como-funciona">
        <Seccion style={{ padding: '88px 28px' }}>
          <Encabezado>
            <Etiqueta>Así de simple</Etiqueta>
            <TituloSeccion>Cómo funciona</TituloSeccion>
          </Encabezado>

          <GrillaPasos>
            <Paso>
              <NumeroPaso><ShoppingBag size={22} strokeWidth={2.2} /></NumeroPaso>
              <TituloPaso>Elige lo que necesita</TituloPaso>
              <DescPaso>Arme su pedido sin necesidad de salir de casa.</DescPaso>
            </Paso>
            <Paso>
              <NumeroPaso><MapPin size={22} strokeWidth={2.2} /></NumeroPaso>
              <TituloPaso>Diga dónde se lo dejamos</TituloPaso>
              <DescPaso>Marque su dirección de entrega en el mapa al momento de pagar.</DescPaso>
            </Paso>
            <Paso>
              <NumeroPaso><Wallet size={22} strokeWidth={2.2} /></NumeroPaso>
              <TituloPaso>Pague como prefiera</TituloPaso>
              <DescPaso>Elija su método de pago y listo: el pedido queda en camino.</DescPaso>
            </Paso>
          </GrillaPasos>
        </Seccion>
      </FranjaClara>

      <Seccion id="ubicacion">
        <Encabezado>
          <Etiqueta>Dónde estamos</Etiqueta>
          <TituloSeccion>Ubicación</TituloSeccion>
        </Encabezado>

        <TarjetaUbicacion>
          <EnlaceMapa href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <PinGrande><MapPin size={24} strokeWidth={2.2} /></PinGrande>
            <Direccion>{ajustes.direccion}</Direccion>
          </EnlaceMapa>
          <Acciones>
            <BotonMapa href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin size={17} strokeWidth={2.2} /> Ver en Google Maps
            </BotonMapa>
            {whatsapp && (
              <BotonWhats href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} strokeWidth={2.2} /> Escríbanos por WhatsApp
              </BotonWhats>
            )}
          </Acciones>
        </TarjetaUbicacion>
      </Seccion>

      <CTAFinal>
        <TituloCTA>¿Ya sabe qué necesita?</TituloCTA>
        <BotonHeroPrimario onClick={entrar} style={{ margin: '0 auto' }}>
          Entrar a la tienda <ArrowRight size={18} strokeWidth={2.4} />
        </BotonHeroPrimario>
      </CTAFinal>

      <PieTienda />
    </Pagina>
  );
};

export default Inicio;
