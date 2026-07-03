import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStep2 } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import api from '../api/api';

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
  gap: 8px;
  justify-content: flex-start;
  margin-top: 8px;
`;

const CodeInput = styled.input`
  width: 48px;
  height: 54px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  color: #000;
  transition: border-color 0.2s;
  text-transform: uppercase;

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
  
  &:disabled {
    background: #d8c5af;
    cursor: not-allowed;
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
  
  // Dependiendo del flujo, necesitamos 4 (2FA empleado) o 6 (registro/recuperación hex) dígitos
  const flow = localStorage.getItem('verificationFlow') || '2fa'; 
  const codeLength = flow === '2fa' ? 4 : 6;
  
  const [code, setCode] = useState(Array(codeLength).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identifier = localStorage.getItem('tempIdentifier') || 'tu correo';
  const pendingToken = localStorage.getItem('pendingToken');

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < codeLength - 1) {
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
    if (fullCode.length !== codeLength) {
      setError(`Ingresa el código de ${codeLength} caracteres`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (flow === 'register') {
        // 1- Verificamos el código para Registro de Cliente
        await api.post('/registerClient/verifyCodeEmail', {
          verificationCodeRequest: fullCode
        });
        toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
        localStorage.removeItem('verificationFlow');
        navigate('/');
      } 
      else if (flow === 'recovery') {
        // 2- Verificamos el código para Recuperación de contraseña
        await api.post('/recoveryPasswordClient/verifyCode', {
          code: fullCode
        });
        toast.success('Código verificado correctamente.');
        navigate('/create-password');
      } 
      else {
        // 3- Flujo 2FA de Empleado (Por defecto)
        if (!pendingToken) {
          setError('Sesión inválida, vuelve a iniciar sesión');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        
        const res = await loginStep2({
          pendingToken,
          otpCode: fullCode
        });
        
        const userType = identifier.includes('admin') ? 'admin' : 'employee';
        login(res.token, userType);
        
        localStorage.removeItem('tempIdentifier');
        localStorage.removeItem('tempMethod');
        localStorage.removeItem('pendingToken');
        
        toast.success('¡Autenticación completada con éxito!');
        navigate('/dashboard');
      }

    } catch (err) {
      setError('Código incorrecto o expirado.');
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
          <BackButton onClick={() => navigate(-1)}>←</BackButton>

          <SectionTitle>Ingresa el código de verificación</SectionTitle>

          <InfoBox>
            <InfoText>Se ha enviado un código a {identifier}</InfoText>

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
            <ResendLink onClick={() => alert('Solicita un nuevo código.')}>
              Solicitar código nuevo
            </ResendLink>
          </ResendRow>
        </Card>
      </Body>
    </Container>
  );
};

export default Verification;