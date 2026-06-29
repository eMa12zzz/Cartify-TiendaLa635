import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
  transition: all 0.2s;

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

  &:hover {
    transform: translateY(-2px);
    background: ${BROWN_DARK};
  }
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

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleIrTienda = () => {
    navigate('/store');
  };

  const handleIrImpresiones = () => {
    navigate('/impresiones');
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

        <ServiceGrid>
          <ServiceCard onClick={handleIrTienda}>
            <ServiceTitle>Tienda</ServiceTitle>
            <ServiceDesc>Compra tus productos aquí!!!!</ServiceDesc>
          </ServiceCard>

          <ServiceCard onClick={handleIrImpresiones}>
            <ServiceTitle>Impresiones</ServiceTitle>
            <ServiceDesc>Imprime tus archivos aquí!!!!</ServiceDesc>
          </ServiceCard>
        </ServiceGrid>
      </Body>

      <Footer>Sobre Nosotros</Footer>
    </Container>
  );
};

export default Dashboard;