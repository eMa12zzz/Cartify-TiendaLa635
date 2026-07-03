import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStep1 } from '../api/authApi';
import styled from 'styled-components';

const BROWN = '#8B5A2B';
const BROWN_HOVER = '#7a4e26';

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

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 20px 0;
`;

const MethodTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const MethodTab = styled.button`
  padding: 9px 18px;
  border-radius: 8px;
  border: 1.5px solid ${({ $active }) => ($active ? BROWN : '#e0e0e0')};
  background: ${({ $active }) => ($active ? BROWN : 'white')};
  color: ${({ $active }) => ($active ? 'white' : '#555')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
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
  margin-bottom: 16px;
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
    background: ${BROWN_HOVER};
  }
`;

const Divider = styled.div`
  text-align: center;
  color: #ccc;
  font-size: 13px;
  margin: 14px 0;
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 12px;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 10px;
`;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-10 7L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('correo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!email || !password) {
      setError('Ingrese su correo y contraseña');
      return;
    }
    
    try {
      setLoading(true);
      const res = await loginStep1({ email, password });
      
      localStorage.setItem('tempIdentifier', email);
      localStorage.setItem('tempMethod', 'email');
      localStorage.setItem('pendingToken', res.pendingToken);
      
      navigate('/verification');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
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
          <SectionTitle>Iniciar Sesión</SectionTitle>

          <MethodTabs>
            <MethodTab $active={activeTab === 'correo'} onClick={() => setActiveTab('correo')}>
              <MailIcon /> Correo
            </MethodTab>
            <MethodTab $active={activeTab === 'telefono'} onClick={() => setActiveTab('telefono')}>
              <PhoneIcon /> Teléfono
            </MethodTab>
          </MethodTabs>

          <Label>Correo</Label>
          <Input
            type="email"
            placeholder="Ingrese su correo"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />

          <Label>Contraseña</Label>
          <Input
            type="password"
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button onClick={handleContinue} disabled={loading}>
            {loading ? 'Cargando...' : 'Continuar →'}
          </Button>

          <Divider>o</Divider>

          <GoogleButton>
            <GoogleIcon /> Ingresar con Google
          </GoogleButton>
        </Card>
      </Body>
    </Container>
  );
};

export default Login;