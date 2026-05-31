import { useState } from 'react';
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
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: #7a4e26;
  }
`;

const RequirementsBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ReqItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${({ $met }) => ($met ? '#22c55e' : '#aaa')};
  transition: color 0.2s;
`;

const ReqDot = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid ${({ $met }) => ($met ? '#22c55e' : '#ccc')};
  background: ${({ $met }) => ($met ? '#22c55e' : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  font-size: 10px;
  color: white;
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 10px;
`;

const CreatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const identifier = localStorage.getItem('tempIdentifier');

  const checks = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    noSpace: password.length > 0 && !/\s/.test(password),
    num: /[0-9]/.test(password),
  };

  const handleSubmit = () => {
    if (!password) {
      setError('Ingrese una contraseña');
      return;
    }
    if (!checks.len || !checks.upper || !checks.noSpace || !checks.num) {
      setError('La contraseña no cumple todos los requisitos');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push({ identifier, password });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ identifier }));
    navigate('/dashboard');
  };

  return (
    <Container>
      <TopBar>
        <BrandSmall>Tienda</BrandSmall>
        <BrandName>la 635</BrandName>
      </TopBar>

      <Body>
        <Card>
          <BackButton onClick={() => navigate('/verification')}>←</BackButton>

          <SectionTitle>Crea una contraseña</SectionTitle>

          <Label>Contraseña</Label>
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button onClick={handleSubmit}>
            Continuar →
          </Button>

          <RequirementsBox>
            <ReqItem $met={checks.len}>
              <ReqDot $met={checks.len}>{checks.len && '✓'}</ReqDot>
              Debe tener al menos 8 caracteres
            </ReqItem>
            <ReqItem $met={checks.upper}>
              <ReqDot $met={checks.upper}>{checks.upper && '✓'}</ReqDot>
              Incluye al menos una letra mayúscula (A-Z)
            </ReqItem>
            <ReqItem $met={checks.noSpace}>
              <ReqDot $met={checks.noSpace}>{checks.noSpace && '✓'}</ReqDot>
              No dejar espacios vacíos
            </ReqItem>
            <ReqItem $met={checks.num}>
              <ReqDot $met={checks.num}>{checks.num && '✓'}</ReqDot>
              Incluir al menos un número (0-9)
            </ReqItem>
          </RequirementsBox>
        </Card>
      </Body>
    </Container>
  );
};

export default CreatePassword;