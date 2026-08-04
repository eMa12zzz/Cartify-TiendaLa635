import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useModulos } from '../hooks/useModulos';
import { useAuth } from '../hooks/useAuth';
import { iconoDeModulo, flujoDeModulo } from '../utils/modulos';

const BROWN = '#8B5A2B';
const BROWN_DARK = '#5a3a1a';

const Container = styled.div`
  min-height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  width: 100%;
  border-bottom: 1px solid #e8e8e8;
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const BrandCenter = styled.div`
  text-align: center;
  cursor: pointer;
`;

const BrandSmall = styled.span`
  display: block;
  font-size: 13px;
  color: #888;
  line-height: 1.2;
`;

const BrandName = styled.span`
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  line-height: 1.2;
`;

const LogoutBtn = styled.button`
  position: absolute;
  right: 20px;
  padding: 7px 14px;
  background: transparent;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);

  &:hover {
    background: #ff4d4f;
    color: white;
  }
`;

const Body = styled.div`
  flex: 1;
  padding: 40px 32px;
  width: 100%;
  box-sizing: border-box;
  max-width: 800px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #000;
  margin: 0 0 20px 0;
`;

const ServiceGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ServiceCard = styled.div`
  background: ${BROWN};
  border-radius: 14px;
  padding: 40px 28px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  gap: 20px;

  &:hover {
    transform: translateY(-2px);
    background: ${BROWN_DARK};
  }
`;

const ServiceIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Vacio = styled.p`
  color: #888;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
`;

const ServiceTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px 0;
`;

const ServiceDesc = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
`;

const Footer = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #ccc;
  margin-top: auto;
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { modulos, cargando } = useModulos();

  /*
   * La sesión ya no se lee a mano de localStorage: vive en dos cajones, uno
   * por área, y quién manda depende de dónde está parada la persona. Leer la
   * llave 'token' aquí dejaba esta pantalla mandando al login para siempre,
   * porque esa llave ya no existe. Ver AuthContext.
   */
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/iniciar-sesion?volver=/tienda-dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Cerrar sesión deja en la tienda, que ahora es pública. Y cierra SOLO la
  // de esta área: un localStorage.clear() se llevaba de paso el carrito, las
  // direcciones guardadas y la sesión del panel.
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /*
   * A dónde lleva cada módulo. Los pasillos normales van a la MISMA tienda,
   * ya parada en su estantería; solo los que tienen flujo propio abren otra
   * pantalla. Por eso agregar la panadería no necesita ruta nueva.
   */
  const abrirModulo = (modulo) => {
    if (flujoDeModulo(modulo) === 'impresiones') {
      navigate('/impresiones');
      return;
    }
    navigate(`/store?modulo=${modulo._id}`);
  };

  return (
    <Container>
      <TopBar>
        <BrandCenter onClick={() => navigate('/tienda-dashboard')}>
          <BrandSmall>Tienda</BrandSmall>
          <BrandName>la 635</BrandName>
        </BrandCenter>
        <LogoutBtn onClick={handleLogout}>Cerrar Sesión</LogoutBtn>
      </TopBar>

      <Body>
        <SectionTitle>Servicios</SectionTitle>

        {/*
          Los servicios salen de los módulos de la tienda. Antes estaban
          escritos aquí a mano, así que abrir la panadería significaba
          programar otra tarjeta: hoy basta con crear el módulo en el panel.
        */}
        {cargando ? (
          <Vacio>Cargando los servicios…</Vacio>
        ) : modulos.length === 0 ? (
          <Vacio>Todavía no hay servicios disponibles.</Vacio>
        ) : (
          <ServiceGrid>
            {modulos.map((modulo) => {
              const Icono = iconoDeModulo(modulo);
              return (
                <ServiceCard key={modulo._id} onClick={() => abrirModulo(modulo)}>
                  <ServiceIcon><Icono size={26} strokeWidth={1.8} /></ServiceIcon>
                  <div>
                    <ServiceTitle>{modulo.name}</ServiceTitle>
                    <ServiceDesc>{modulo.description || 'Ver los productos de esta sección'}</ServiceDesc>
                  </div>
                </ServiceCard>
              );
            })}
          </ServiceGrid>
        )}
      </Body>

      <Footer>Sobre Nosotros</Footer>
    </Container>
  );
};

export default Dashboard;