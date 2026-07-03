import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStep2 } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import styled from 'styled-components';
import toast from 'react-hot-toast';

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

  &:hover {
    color: ${BROWN};
  }
`;

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 16px 0;
`;

const InfoBox = styled.div`
  background: #f9f9f9;
  border: 1px solid #efefef;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 24px;
`;

const InfoText = styled.p`
  font-size: 13px;
  color: #888;
  margin: 0 0 4px 0;
  line-height: 1.5;
`;

const InfoPhone = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
`;

const CodeContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  margin-top: 8px;
`;

const CodeInput = styled.input`
  width: 54px;
  height: 58px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  color: #000;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${BROWN};
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
  margin-bottom: 16px;
  transition: background 0.2s;

  &:hover {
    background: #7a4e26;
  }
`;

const ResendRow = styled.div`
  font-size: 13px;
  color: #888;
`;

const ResendLink = styled.span`
  color: ${BROWN};
  font-weight: 600;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
`;

const Verification = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identifier = localStorage.getItem('tempIdentifier') || 'Usuario';
  const pendingToken = localStorage.getItem('pendingToken');

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Ingresa el código de 4 dígitos');
      return;
    }
    
    if (!pendingToken) {
      setError('Sesión inválida, vuelve a iniciar sesión');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    try {
      setLoading(true);
      const res = await loginStep2({
        pendingToken,
        otpCode: fullCode
      });
      
      // Usa el hook global para guardar el token de sesión final
      const userType = identifier.includes('admin') ? 'admin' : 'employee';
      login(res.token, userType);
      
      // Clean up temporary auth data
      localStorage.removeItem('tempIdentifier');
      localStorage.removeItem('tempMethod');
      localStorage.removeItem('pendingToken');
      
      toast.success('¡Autenticación completada con éxito!', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // Redirect to admin or home based on role
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Código incorrecto');
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
          <BackButton onClick={() => navigate('/')}>←</BackButton>

          <SectionTitle>Ingresa el código de verificación</SectionTitle>

          <InfoBox>
            <InfoText>Código de 4 dígitos enviado a {identifier}</InfoText>
            <InfoPhone>+503 5555-5555</InfoPhone>

            <CodeContainer>
              {code.map((digit, idx) => (
                <CodeInput
                  key={idx}
                  id={`code-${idx}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              ))}
            </CodeContainer>
          </InfoBox>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button onClick={handleVerify} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>

          <ResendRow>
            ¿No has recibido el código aún?{' '}
            <ResendLink onClick={() => alert('Código reenviado: 0000')}>
              Solicitar código nuevo
            </ResendLink>
          </ResendRow>
        </Card>
      </Body>
    </Container>
  );
};

export default Verification;