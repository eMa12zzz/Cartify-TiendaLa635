import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const BROWN = '#8B5A2B';

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
  max-width: 420px;
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

  &:hover {
    color: ${BROWN};
  }
`;

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 24px 0;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 13px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
  outline: none;
  color: #000;
  margin-bottom: 20px;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${BROWN};
  }

  &::placeholder {
    color: #bbb;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 13px;
  background: ${BROWN};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #7a4e26;
  }
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
`;

const LoginPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const identifier = localStorage.getItem('tempIdentifier');

  useEffect(() => {
    if (!identifier) navigate('/');
  }, [identifier, navigate]);

  const handleLogin = () => {
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.identifier === identifier && u.password === password);
    if (user) {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ identifier }));
      navigate('/dashboard');
    } else {
      setError('Contraseña incorrecta');
    }
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

          <SectionTitle>Ingresa tu contraseña</SectionTitle>

          <Label>Contraseña</Label>
          <Input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button onClick={handleLogin}>Iniciar Sesión</Button>
        </Card>
      </Body>
    </Container>
  );
};

export default LoginPassword;