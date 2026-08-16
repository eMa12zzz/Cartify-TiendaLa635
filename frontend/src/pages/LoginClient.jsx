import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Lock, Loader2, ArrowRight, Store as StoreIcon, Star, Bike, Heart } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { loginClientDB, googleLoginDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { BotonOjo } from '../components/UI/CampoContrasena';
import { useAjustesCtx } from '../context/AjustesContext';
import { consumirRecienRegistrado } from '../utils/primerIngreso';

const BROWN = 'var(--marca-600)';

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

/*
 * La barra de arriba: SOLO el nombre y la salida a la tienda.
 *
 * No es el HeaderTienda completo a propósito —aquí no hacen falta el buscador
 * ni los pasillos— pero se viste igual que él: mismo alto de 64px, misma línea
 * de abajo y el mismo relleno lateral, para que pasar de la tienda al login no
 * se sienta como cambiar de sitio.
 *
 * Lo que sí se arregló: el nombre estaba escrito a mano ("Tienda" / "la 635"),
 * así que si el dueño le cambiaba el nombre al negocio, esta pantalla —la
 * primera que ve quien va a entregar su correo— seguía diciendo el viejo.
 * Ahora sale de los ajustes, igual que en el encabezado de verdad.
 */
const TopBar = styled.header`
  background: #fff;
  border-bottom: 1px solid #ECE7E1;
  padding: 0 28px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 700px) { padding: 0 16px; }
`;

const Marca = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 8px;
  border-radius: 12px;
  transition: background-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: var(--marca-50); }
  }
  &:active { transform: scale(0.97); }
`;

/* Las dos líneas del nombre, con el mismo peso y color: "Tienda" no es una
   etiqueta que acompaña a "la 635", es parte del nombre del negocio. */
const Linea = styled.span`
  display: block;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.4px;
  color: var(--tinta);
`;

/* La misma pastilla que los botones del encabezado de la tienda. */
const VolverTienda = styled.button`
  background: var(--papel);
  border: 1px solid var(--linea);
  color: var(--tinta-suave);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  height: 44px;
  border-radius: var(--radio-pill);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { color: var(--marca-600); }
  }
  &:active { transform: scale(0.97); }
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
  color: #101820;
  margin: 0 0 16px;

  strong { color: ${BROWN}; font-weight: 800; }
`;

const Bajada = styled.p`
  font-size: 15.5px;
  line-height: 1.6;
  color: #6B7280;
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
  color: #4B5563;
  line-height: 1.45;

  strong { color: #1C1614; font-weight: 700; }
`;

const IconoVentaja = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #F1F6F9;
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
  color: #1C1614;
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
  box-shadow: 0 8px 20px rgba(0, 48, 73, 0.28);
  transition: background 0.18s, transform 0.18s;

  &:hover { background: #00283D; transform: translateY(-1px); }
`;

// ── La mitad de la derecha: el formulario ──
const Card = styled.div`
  width: 100%;
  background: #fff;
  border: 1px solid #ECE7E1;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 48, 73, 0.10);
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
  color: #101820;
  margin: 0 0 6px 0;
  text-align: center;
`;

const SubTitle = styled.p`
  font-size: 13.5px;
  color: #9CA3AF;
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
    box-shadow: 0 0 0 3px rgba(0,48,73,0.08);
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

  &:hover { background: #00283D; }
  &:disabled { background: #C9D4DB; cursor: not-allowed; }
`;

// Separador "o" entre el formulario y el botón de Google.
const Divisor = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 18px;
  color: #b7b0a8;
  font-size: 12.5px;
  font-weight: 600;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee;
  }
`;

// El botón de Google se centra en su fila.
const GoogleFila = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
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
  const { login, logout } = useAuth();
  // El nombre de la tienda sale de los ajustes, no escrito a mano.
  const { ajustes } = useAjustesCtx();
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

  /*
   * Lo que pasa DESPUÉS de que el backend confirmó la sesión, sea por
   * contraseña o por Google: se guarda en el contexto y se decide a dónde ir.
   * Se comparte para que las dos puertas se comporten igual.
   */
  const alEntrar = (res) => {
      // 3- Guardamos el token y datos del cliente en el contexto
      /*
       * El tipo lo dice el servidor: por esta misma puerta entran clientes y
       * personal, y de eso depende que se vea "Reparto" en el menú.
       */
      login(res.token, res.userType || 'client', res.client);

      const esPersonal = res.userType && res.userType !== 'client';

      /*
       * Si entró personal, se cierra la sesión de CLIENTE que hubiera abierta.
       *
       * Su sesión cae en el cajón del personal (la decide el tipo de cuenta),
       * pero fuera del panel manda el cajón de cliente si existe. En el
       * teléfono del mostrador —donde alguien dejó su sesión abierta— el
       * repartidor acababa de entrar con su usuario, veía el nombre del cliente
       * anterior y Reparto le decía "esta pantalla es para el personal". Un
       * login que aparentaba funcionar y dejaba muerto justo su flujo.
       */
      if (esPersonal) logout('cliente');

      /*
       * El saludo con el mapa es SOLO para quien acaba de crear su cuenta.
       *
       * Antes lo veía todo el mundo, en cada inicio de sesión: quien lleva
       * meses comprando y ya tiene su casa y su trabajo guardados entraba a
       * marcar un punto en un mapa que no necesitaba. La marca la deja el
       * registro al verificar el código; ver utils/primerIngreso.js.
       *
       * Se consume acá aunque después mande a otro lado, para que no quede
       * dando vueltas y aparezca días más tarde sin venir a cuento.
       */
      const recienRegistrado = !esPersonal && consumirRecienRegistrado();

      /*
       * Primero manda a dónde iba; si llegó aquí por su cuenta, al personal lo
       * espera el reparto, al recién llegado el mapa donde deja su dirección, y
       * a todos los demás la tienda.
       *
       * El `volver` se revisa antes de seguirlo: tiene que ser una ruta de la
       * casa. Sin esa comprobación, un enlace con ?volver=https://otro-sitio
       * usaría nuestro login como trampolín — LoginAdmin ya lo validaba y esta
       * pantalla no.
       */
      const destino = volver?.startsWith('/') ? volver : null;

      /*
       * `replace` a propósito: el login se reemplaza en el historial en vez de
       * apilarse. Sin esto, tras entrar el historial quedaba [tienda, login,
       * destino] y el "atrás" del navegador caía de vuelta en el login —una
       * pantalla que ya cumplió y a la que nadie quiere volver.
       */
      if (destino) navigate(destino, { replace: true });
      else if (esPersonal) navigate('/mi-cuenta/reparto', { replace: true });
      else navigate(recienRegistrado ? '/bienvenida' : '/', { replace: true });
  };

  // 2- Enviar credenciales al backend de clientes (SELECT y VERIFY)
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await loginClientDB({ email: data.email, password: data.password });
      alEntrar(res);
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión con Google. El botón nos entrega el ID token; lo mandamos
  // al backend y, si todo cuadra, seguimos el mismo camino que el login normal.
  const onGoogle = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      toast.error('No se recibió la respuesta de Google');
      return;
    }
    try {
      setLoading(true);
      const res = await googleLoginDB(credential);
      alEntrar(res);
    } catch (err) {
      /*
       * Esta pantalla es para ENTRAR, no para registrarse. Si Google trae un
       * correo que no tiene cuenta, el servidor se niega a crearla aquí: no
       * hay dónde aceptar los términos ni dónde dejar un teléfono, y una
       * cuenta creada a la callada es justo lo que rompía el consentimiento.
       *
       * Así que se lleva a Registro, que sí tiene las casillas, en vez de
       * dejar un aviso rojo que no dice qué hacer.
       */
      if (err.requiereConsentimiento) {
        /*
         * Y se va CON lo que Google ya dio. Antes esto mandaba a /register en
         * blanco: la persona acababa de autorizar a la tienda a leer su nombre
         * y su correo, y lo primero que veía era un formulario vacío
         * pidiéndoselos otra vez.
         *
         * El token viaja en el estado de la navegación y no en la URL: un
         * token de Google en la barra de direcciones queda en el historial, en
         * los registros del servidor y en cualquier captura de pantalla.
         */
        navigate('/completar-registro', {
          state: { credential, sugerido: err.sugerido || {}, volverA: volver || '/' },
        });
        return;
      }
      toast.error(err.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <TopBar>
        <Marca type="button" onClick={() => navigate('/')} title="Ir a la tienda">
          <Linea>{ajustes.nombreLinea1}</Linea>
          {ajustes.nombreLinea2 && <Linea>{ajustes.nombreLinea2}</Linea>}
        </Marca>
        <VolverTienda type="button" onClick={() => navigate('/')}>
          <StoreIcon size={16} strokeWidth={2.2} /> Seguir viendo la tienda
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

          <Divisor>o</Divisor>

          <GoogleFila>
            <GoogleLogin
              onSuccess={onGoogle}
              onError={() => toast.error('No se pudo iniciar sesión con Google')}
              text="continue_with"
              shape="pill"
              locale="es"
              width="320"
            />
          </GoogleFila>

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
