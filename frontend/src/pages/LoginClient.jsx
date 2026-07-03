import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginClientDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

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

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 6px 0;
`;

const SubTitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0 0 28px 0;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 14px;
  color: #aaa;
  pointer-events: none;
  display: flex;
  align-items: center;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px 12px 44px;
  border: 1.5px solid ${({ $error }) => ($error ? '#ff4d4f' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  color: #000;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${BROWN};
    box-shadow: 0 0 0 3px rgba(139,90,43,0.08);
  }

  &::placeholder { color: #bbb; }
`;

const ErrorMsg = styled.span`
  color: #ff4d4f;
  font-size: 12px;
  display: block;
  margin-top: 5px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const RememberLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
`;

const ForgotLink = styled(Link)`
  font-size: 13px;
  color: ${BROWN};
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
  margin-bottom: 20px;

  &:hover { background: #7a4e26; }
  &:disabled { background: #d8c5af; cursor: not-allowed; }
`;

const FooterText = styled.div`
  text-align: center;
  font-size: 13px;
  color: #888;
`;

const FooterLink = styled(Link)`
  color: ${BROWN};
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const LoginClient = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // 1- Limpiar sesión previa al entrar al login
  useEffect(() => {
    logout();
  }, [logout]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // 2- Enviar credenciales al backend de clientes (SELECT y VERIFY)
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await loginClientDB({ email: data.email, password: data.password });
      // 3- Guardamos el token y datos del cliente en el contexto
      login(res.token, 'client', res.client);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/tienda-dashboard');
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas');
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
          <SectionTitle>Inicia sesión</SectionTitle>
          <SubTitle>¡Bienvenido de nuevo! Ingresa tus datos para continuar.</SubTitle>

          <form onSubmit={handleSubmit(onSubmit)}>

            <FieldGroup>
              <Label>Correo Electrónico</Label>
              <InputWrapper>
                <IconWrapper><Mail size={18} /></IconWrapper>
                <Input
                  type="email"
                  placeholder="juan@ejemplo.com"
                  $error={!!errors.email}
                  {...register('email', {
                    required: 'El correo es requerido',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato inválido' }
                  })}
                />
              </InputWrapper>
              {errors.email && <ErrorMsg>{errors.email.message}</ErrorMsg>}
            </FieldGroup>

            <FieldGroup>
              <Label>Contraseña</Label>
              <InputWrapper>
                <IconWrapper><Lock size={18} /></IconWrapper>
                <Input
                  type="password"
                  placeholder="••••••••"
                  $error={!!errors.password}
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                />
              </InputWrapper>
              {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
            </FieldGroup>

            <Row>
              <RememberLabel>
                <input type="checkbox" {...register('rememberMe')} />
                Recordarme 30 días
              </RememberLabel>
              <ForgotLink to="/forgot-password">¿Olvidaste tu contraseña?</ForgotLink>
            </Row>

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Iniciar sesión'}
            </Button>

          </form>

          <FooterText>
            ¿No tienes una cuenta?{' '}
            <FooterLink to="/register">Regístrate</FooterLink>
          </FooterText>
        </Card>
      </Body>
    </Container>
  );
};

export default LoginClient;
