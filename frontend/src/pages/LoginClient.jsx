import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Lock, Loader2, ArrowRight, Store as StoreIcon, Star, Bike, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginClientDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { BotonOjo } from '../components/UI/CampoContrasena';

const BROWN = '#B46C30';

/*
 * ============================================================
 * INICIAR SESIÓN — la puerta, ya no el portón
 * ============================================================
 * Esta pantalla dejó de ser lo primero que ve todo el mundo: ahora se entra
 * directo a la tienda y aquí se llega solo cuando hace falta una cuenta (al
 * pagar, en Mi Cuenta, para guardar favoritos).
 *
 * Por eso el diseño cambió de un formulario solo en medio de la nada a dos
 * mitades: a la izquierda quién es la tienda y por qué vale la pena tener
 * cuenta, a la derecha el formulario. Quien llega aquí ya venía haciendo
 * algo, y la pantalla tiene que verse como parte de la misma tienda y no
 * como un peaje.
 * ============================================================
 */

const Container = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  width: 100%;
  border-bottom: 1px solid #ebebeb;
  padding: 12px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Marca = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
`;

const BrandSmall = styled.span`
  display: block;
  font-size: 12px;
  color: #aaa;
  line-height: 1.1;
`;

const BrandName = styled.span`
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

// Salida sin compromiso: quien no quiera cuenta puede seguir viendo la tienda.
const VolverTienda = styled.button`
  background: none;
  border: 1px solid var(--linea, #ebebeb);
  border-radius: 999px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: #6b6b6b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover { border-color: ${BROWN}; color: ${BROWN}; }
`;

const Body = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 40px;
  align-items: center;
  padding: 48px 40px 64px;
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;

  /* En pantalla chica el formulario manda y el saludo se va abajo. */
  @media (max-width: 940px) {
    grid-template-columns: 1fr;
    padding: 32px 20px 48px;
    gap: 28px;
  }
`;

// ── La mitad de la izquierda: quiénes somos ──
const Saludo = styled.div`
  @media (max-width: 940px) { order: 2; text-align: center; }
`;

const Titular = styled.h1`
  font-size: clamp(30px, 4.4vw, 46px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -1px;
  color: #1d1206;
  margin: 0 0 16px;

  strong { color: ${BROWN}; font-weight: 800; }
`;

const Bajada = styled.p`
  font-size: 15.5px;
  line-height: 1.6;
  color: #7a7269;
  margin: 0 0 26px;
  max-width: 440px;

  @media (max-width: 940px) { margin-left: auto; margin-right: auto; }
`;

const Ventajas = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 440px;

  @media (max-width: 940px) { margin-left: auto; margin-right: auto; text-align: left; }
`;

const Ventaja = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 11px;
  font-size: 14px;
  color: #55504a;
  line-height: 1.45;

  strong { color: #2A1A0E; font-weight: 700; }
`;

const IconoVentaja = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #FAF3EB;
  color: ${BROWN};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SinCuenta = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 940px) { justify-content: center; }
`;

const SinCuentaTexto = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #2A1A0E;
`;

const BotonRegistro = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: ${BROWN};
  color: #fff;
  text-decoration: none;
  padding: 12px 22px;
  border-radius: 999px;
  font-size: 14.5px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(180, 108, 48, 0.28);
  transition: background 0.18s, transform 0.18s;

  &:hover { background: #8A5222; transform: translateY(-1px); }
`;

// ── La mitad de la derecha: el formulario ──
const Card = styled.div`
  width: 100%;
  background: #fff;
  border: 1px solid #F0E7DE;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(60, 40, 20, 0.10);
  padding: 32px 30px;

  @media (max-width: 940px) {
    order: 1;
    max-width: 460px;
    margin: 0 auto;
    padding: 26px 22px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #1d1206;
  margin: 0 0 6px 0;
  text-align: center;
`;

const SubTitle = styled.p`
  font-size: 13.5px;
  color: #9a938c;
  margin: 0 0 24px 0;
  text-align: center;
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

  &:hover { background: #8A5222; }
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
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verPass, setVerPass] = useState(false);

  /*
   * A dónde iba antes de que le pidiéramos la cuenta. Lo pone
   * ProtectedRoute y los botones que exigen sesión.
   *
   * Ya no se hace logout al entrar aquí: con la tienda abierta, cualquiera
   * puede caer en esta pantalla de curioso, y cerrarle la sesión por pasar
   * sería un castigo por explorar.
   */
  const volver = params.get('volver');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // 2- Enviar credenciales al backend de clientes (SELECT y VERIFY)
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await loginClientDB({ email: data.email, password: data.password });
      // 3- Guardamos el token y datos del cliente en el contexto
      /*
       * El tipo lo dice el servidor: por esta misma puerta entran clientes y
       * personal, y de eso depende que se vea "Reparto" en el menú.
       */
      login(res.token, res.userType || 'client', res.client);

      const esPersonal = res.userType && res.userType !== 'client';

      /*
       * Primero manda a dónde iba; si llegó aquí por su cuenta, al personal
       * lo espera el reparto y al cliente el saludo con el mapa (que es donde
       * deja su dirección de entrega).
       */
      if (volver) navigate(volver);
      else navigate(esPersonal ? '/mi-cuenta/reparto' : '/bienvenida');
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <TopBar>
        <Marca onClick={() => navigate('/')}>
          <BrandSmall>Tienda</BrandSmall>
          <BrandName>la 635</BrandName>
        </Marca>
        <VolverTienda type="button" onClick={() => navigate('/')}>
          <StoreIcon size={15} strokeWidth={2.2} /> Seguir viendo la tienda
        </VolverTienda>
      </TopBar>

      <Body>
        {/*
          La mitad de la izquierda no está de adorno: quien llegó hasta aquí
          merece saber qué gana con la cuenta antes de escribir su correo.
        */}
        <Saludo>
          <Titular>
            El súper de la esquina, <strong>a un toque</strong>
          </Titular>
          <Bajada>
            Con su cuenta guardamos su dirección, sus puntos y lo que suele llevar,
            para que pedir la próxima vez le tome menos que hacer la lista.
          </Bajada>

          <Ventajas>
            <Ventaja>
              <IconoVentaja><Bike size={16} strokeWidth={2.2} /></IconoVentaja>
              <span><strong>Siga su pedido en el mapa.</strong> Vea al repartidor acercarse y sepa cuándo salir a la puerta.</span>
            </Ventaja>
            <Ventaja>
              <IconoVentaja><Star size={16} strokeWidth={2.2} /></IconoVentaja>
              <span><strong>Junte puntos con cada compra.</strong> Se convierten en descuento la próxima vez.</span>
            </Ventaja>
            <Ventaja>
              <IconoVentaja><Heart size={16} strokeWidth={2.2} /></IconoVentaja>
              <span><strong>Guarde sus favoritos.</strong> Lo de siempre, sin volver a buscarlo.</span>
            </Ventaja>
          </Ventajas>

          <SinCuenta>
            <SinCuentaTexto>¿No tiene cuenta?</SinCuentaTexto>
            <BotonRegistro to="/register">
              Regístrese aquí <ArrowRight size={16} strokeWidth={2.4} />
            </BotonRegistro>
          </SinCuenta>
        </Saludo>

        <Card>
          <SectionTitle>Inicie sesión para comprar</SectionTitle>
          <SubTitle>Puede seguir viendo la tienda sin cuenta.</SubTitle>

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
                  type={verPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{ paddingRight: 44 }}
                  $error={!!errors.password}
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                />
                <BotonOjo visible={verPass} onToggle={() => setVerPass((v) => !v)} />
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
            ¿No tiene una cuenta?{' '}
            <FooterLink to="/register">Regístrese</FooterLink>
          </FooterText>
        </Card>
      </Body>
    </Container>
  );
};

export default LoginClient;
