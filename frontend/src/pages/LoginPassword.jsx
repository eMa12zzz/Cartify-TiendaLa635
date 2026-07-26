import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const BROWN = '#B46C30';

const Container = styled.div`
  min-height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  width: 100%;
  border-bottom: 1px solid #e8e8e8;
  padding: 12px 0;
  text-align: center;
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

const Body = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 500px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #000;
  margin-bottom: 20px;
  padding: 0;
  display: block;

  &:hover { color: ${BROWN}; }
`;

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0 0 28px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  color: #111;
  box-sizing: border-box;
  transition: border-color 0.2s;
  margin-bottom: 20px;

  &:focus { border-color: ${BROWN}; }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: ${BROWN};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background 0.2s;

  &:hover { background: #8A5222; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ErrorMsg = styled.div`
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
`;

const ForgotLink = styled.div`
  text-align: center;
  font-size: 13px;
  color: ${BROWN};
  cursor: pointer;
  font-weight: 600;

  &:hover { text-decoration: underline; }
`;

const LoginPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identifier = localStorage.getItem('tempIdentifier') || '';

  const handleLogin = () => {
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.identifier === identifier);

      if (!user) {
        setError('Usuario no encontrado');
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('Contraseña incorrecta');
        setLoading(false);
        return;
      }

      // ✅ Guardar sesión y redirigir al dashboard de la tienda
      localStorage.setItem('token', 'authenticated');
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/tienda-dashboard');
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Container>
      <TopBar>
        <BrandSmall>Tienda</BrandSmall>
        <BrandName>la 635</BrandName>
      </TopBar>

      <Body>
        <Card>
          <BackButton onClick={() => navigate('/')}>←</BackButton>

          <SectionTitle>Bienvenido de vuelta</SectionTitle>
          <Subtitle>Ingresa tu contraseña para continuar</Subtitle>

          <Label>Contraseña</Label>
          <Input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button onClick={handleLogin} disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </Button>

          <ForgotLink onClick={() => alert('Función de recuperación próximamente')}>
            ¿Olvidaste tu contraseña?
          </ForgotLink>
        </Card>
      </Body>
    </Container>
  );
};

export default LoginPassword;