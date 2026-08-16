import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Phone, User, Hash, Lock, Loader2, Calendar } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { BotonOjo } from '../components/UI/CampoContrasena';
import SubidorArchivo from '../components/UI/SubidorArchivo';
import ModalTerminos from '../components/Store/ModalTerminos';
import { reglaDuiOpcional, reglaTelefono, bloquearNoDigitos } from '../utils/validaciones';
import { calcularEdad, esMayorDeEdad } from '../utils/edad';
import { formatearDui, formatearTelefono, LARGO_DUI, LARGO_TELEFONO } from '../utils/mascaras';
import { useRegistro } from '../hooks/useRegistro';
import { useModalTerminos } from '../hooks/useModalTerminos';
import { googleLoginDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

const BROWN = 'var(--marca-600)';
const BROWN_HOVER = 'var(--marca-700)';

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

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #000;
  margin: 0 0 20px 0;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 6px;
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  pointer-events: none;
  display: flex;
  align-items: center;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px 12px 44px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  color: #000;
  transition: border-color 0.2s;
  background: white;

  &:focus {
    border-color: ${BROWN};
    box-shadow: 0 0 0 3px rgba(0,48,73,0.08);
  }

  &::placeholder {
    color: #bbb;
  }
`;

// Espacio para que el subidor no quede pegado al botón de continuar.
const BloqueFoto = styled.div`
  margin-bottom: 16px;
`;

const ErrorMsg = styled.span`
  color: #ff4d4f;
  font-size: 12px;
  position: absolute;
  bottom: -18px;
  left: 0;
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
  margin-top: 10px;

  &:hover {
    background: ${BROWN_HOVER};
  }
  
  &:disabled {
    background: #C9D4DB;
    cursor: not-allowed;
  }
`;

const Divisor = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
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

const GoogleFila = styled.div`
  display: flex;
  justify-content: center;
`;

const FooterText = styled.div`
  text-align: center;
  margin-top: 18px;
  font-size: 13px;
  color: #888;
`;

const FooterLink = styled.span`
  color: ${BROWN};
  font-weight: 600;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

/*
 * El bloque del consentimiento.
 *
 * Va justo antes del botón y no perdido entre los campos: es lo último que se
 * lee antes de decidir, que es donde tiene que estar. Y son DOS casillas
 * separadas a propósito — aceptar las condiciones y querer publicidad son dos
 * decisiones distintas, y meterlas en una sola casilla es cobrarle una con la
 * otra.
 */
const BloqueConsentimiento = styled.div`
  margin: 24px 0 4px;
  padding: 16px 18px;
  background: #fbfaf9;
  border: 1px solid #eeeae5;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Casilla = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 11px;

  input {
    width: 18px;
    height: 18px;
    margin: 1px 0 0;
    flex-shrink: 0;
    accent-color: ${BROWN};
    cursor: pointer;
  }

  label {
    font-size: 13.5px;
    line-height: 1.55;
    color: #444;
    cursor: pointer;
  }
`;

/*
 * El enlace a los términos, que es un BOTÓN y no un <a>.
 *
 * No navega: abre el documento encima (ver useModalTerminos). Se pinta como
 * enlace porque eso es lo que la persona espera tocar ahí, pero por dentro no
 * puede ser un enlace de verdad — el formulario lleno no se puede arriesgar.
 *
 * Va FUERA de la <label> a propósito: una etiqueta le reenvía al control todos
 * los clics que caen adentro, así que un botón anidado ahí abriría el
 * documento Y desmarcaría la casilla que la persona acaba de marcar.
 */
const EnlaceTerminos = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: ${BROWN};
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;

  &:hover { color: ${BROWN_HOVER}; }
`;

// El renglón de la casilla de términos. Existe porque ahí el texto y el enlace
// son dos elementos separados y tienen que fluir como una sola frase.
const TextoCasilla = styled.div`
  font-size: 13.5px;
  line-height: 1.55;
  color: #444;
`;

// La segunda línea de la casilla de promociones: qué significa decir que sí,
// en letra chica pero presente. "Puede cambiarlo cuando quiera" no es un
// adorno, es la mitad de la razón por la que alguien se anima a marcarla.
const Aclaracion = styled.span`
  display: block;
  margin-top: 3px;
  font-size: 12.5px;
  color: #999;
`;

// El error de la casilla no puede ser el ErrorMsg de los campos: aquel va
// posicionado en absoluto dentro del InputWrapper y aquí no hay ninguno.
const ErrorCasilla = styled.span`
  display: block;
  margin: -6px 0 0 29px;
  color: #ff4d4f;
  font-size: 12px;
`;

const Register = () => {
  const navigate = useNavigate();
  const [verPass, setVerPass] = useState(false);

  // Armar el envío, subir la foto y llevar a la verificación: todo eso vive en
  // el hook. Aquí solo se pinta el formulario. Ver useRegistro.
  const { cargando, elegirArchivo, registrar } = useRegistro();

  /*
   * Los términos se leen ENCIMA del formulario, sin navegar. Se probó con un
   * enlace a pestaña nueva y no basta: hay navegadores —el de adentro de
   * WhatsApp, por donde entra media tienda— que abren encima y se llevan todo
   * lo escrito. Ver useModalTerminos.
   */
  const { abierto: terminosAbiertos, abrir: abrirTerminos, cerrar: cerrarTerminos } =
    useModalTerminos();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const { login } = useAuth();
  const [entrandoGoogle, setEntrandoGoogle] = useState(false);

  /*
   * Registrarse con Google. No pasa por el flujo de verificación por código: el
   * correo ya viene confirmado por Google, así que la cuenta queda lista y se
   * entra directo a la tienda. Si el correo ya existía, simplemente inicia esa
   * sesión (el backend lo enlaza).
   */
  const onGoogle = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      toast.error('No se recibió la respuesta de Google');
      return;
    }
    /*
     * El consentimiento viaja TAMBIÉN por el camino de Google.
     *
     * Antes no: entrar con Google creaba la cuenta de una y se saltaba las
     * casillas de esta misma pantalla, así que quedaba un cliente sin
     * constancia de haber aceptado los términos y —peor— inscrito en
     * promociones por el valor por defecto del modelo, sin haberlo pedido.
     *
     * Se revisa aquí antes de molestar al servidor, y el servidor lo vuelve a
     * exigir por su cuenta: la casilla del navegador no le prueba nada a nadie.
     */
    if (!watch('aceptaTerminos')) {
      toast.error('Marque primero que acepta los términos y el aviso de privacidad');
      return;
    }

    try {
      setEntrandoGoogle(true);
      const res = await googleLoginDB(credential, {
        aceptaTerminos: true,
        promociones: !!watch('promociones'),
        // Google no da teléfono. Si ya lo escribió arriba, se aprovecha; sin
        // él la cuenta queda sin a quién llamar cuando no encuentren la casa.
        phoneNumber: watch('phoneNumber') || '',
      });
      login(res.token, res.userType || 'client', res.client);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message || 'No se pudo registrar con Google');
    } finally {
      setEntrandoGoogle(false);
    }
  };

  // El DUI solo se pide cuando la fecha de nacimiento ya dice que es mayor: en
  // El Salvador el DUI se emite a los 18, así que antes no hay ninguno que dar.
  const puedeDui = esMayorDeEdad(watch('fechaNacimiento'));

  return (
    <Container>
      <TopBar>
        <BrandSmall>Tienda</BrandSmall>
        <BrandName>la 635</BrandName>
      </TopBar>

      <Body>
        <Card>
          <SectionTitle>Regístrate</SectionTitle>

          <form onSubmit={handleSubmit(registrar)}>
            
            <InputContainer>
              <Label>Nombre Completo</Label>
              <InputWrapper>
                <IconWrapper><User size={18} /></IconWrapper>
                <Input
                  type="text"
                  placeholder="Juan Pérez"
                  {...register("fullName", { required: "El nombre es obligatorio" })}
                />
                {errors.fullName && <ErrorMsg>{errors.fullName.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            <InputContainer>
              <Label>Nombre de Usuario</Label>
              <InputWrapper>
                <IconWrapper><User size={18} /></IconWrapper>
                <Input
                  type="text"
                  placeholder="juanperez99"
                  {...register("userName", { required: "El nombre de usuario es obligatorio" })}
                />
                {errors.userName && <ErrorMsg>{errors.userName.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            {/*
              Fecha de nacimiento: para calcular la edad de los productos +18.
              Es obligatoria, pero NO bloquea a los menores de tener cuenta —
              pueden comprar lo demás; solo no verán los productos restringidos.
              Va ANTES que el DUI porque es la que decide si el DUI se pide.
            */}
            <InputContainer>
              <Label>Fecha de nacimiento</Label>
              <InputWrapper>
                <IconWrapper><Calendar size={18} /></IconWrapper>
                <Input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register("fechaNacimiento", {
                    required: "La fecha de nacimiento es obligatoria",
                    validate: (v) => {
                      const edad = calcularEdad(v);
                      if (edad == null) return "Esa fecha no es válida";
                      if (edad < 0 || edad > 120) return "Revisá la fecha";
                      return true;
                    },
                  })}
                />
                {errors.fechaNacimiento && <ErrorMsg>{errors.fechaNacimiento.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            {/*
              El DUI solo aparece cuando la fecha ya dice que es mayor de edad:
              es opcional, y a un menor no tendría por qué pedírsele. Se revisa
              solo si escribió algo (ver reglaDuiOpcional).
            */}
            {puedeDui && (
              <InputContainer>
                <Label>DUI (opcional)</Label>
                <InputWrapper>
                  <IconWrapper><Hash size={18} /></IconWrapper>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={LARGO_DUI}
                    placeholder="00000000-0"
                    {...register("dui", reglaDuiOpcional)}
                    onKeyDown={bloquearNoDigitos}
                    // El guion se pone solo: si cada quien lo escribe a su manera,
                    // el mismo DUI termina guardado de tres formas distintas.
                    onInput={(e) => { e.target.value = formatearDui(e.target.value); }}
                  />
                  {errors.dui && <ErrorMsg>{errors.dui.message}</ErrorMsg>}
                </InputWrapper>
              </InputContainer>
            )}

            <InputContainer>
              <Label>Teléfono</Label>
              <InputWrapper>
                <IconWrapper><Phone size={18} /></IconWrapper>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={LARGO_TELEFONO}
                  placeholder="7000-0000"
                  {...register("phoneNumber", reglaTelefono)}
                  onKeyDown={bloquearNoDigitos}
                  onInput={(e) => { e.target.value = formatearTelefono(e.target.value); }}
                />
                {errors.phoneNumber && <ErrorMsg>{errors.phoneNumber.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            {/*
              Aquí había un campo de "Dirección" en texto plano. Se quitó: lo
              que escribía la persona se guardaba aparte y NUNCA se usaba para
              entregar nada. Las direcciones de verdad se agregan en
              "Mi cuenta > Direcciones", con referencia y punto en el mapa, y de
              ahí las toman el encabezado de la tienda y el checkout.
            */}

            <InputContainer>
              <Label>Correo Electrónico</Label>
              <InputWrapper>
                <IconWrapper><Mail size={18} /></IconWrapper>
                <Input
                  type="email"
                  placeholder="juan@ejemplo.com"
                  {...register("email", { 
                    required: "El correo es obligatorio",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Formato de correo inválido"
                    }
                  })}
                />
                {errors.email && <ErrorMsg>{errors.email.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            <InputContainer>
              <Label>Contraseña</Label>
              <InputWrapper>
                <IconWrapper><Lock size={18} /></IconWrapper>
                <Input
                  type={verPass ? 'text' : 'password'}
                  placeholder="********"
                  style={{ paddingRight: 44 }}
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                  })}
                />
                <BotonOjo visible={verPass} onToggle={() => setVerPass((v) => !v)} />
                {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            <Label>Foto de Perfil (Opcional)</Label>
            <BloqueFoto>
              {/* Recorte "cover": es una foto de perfil, se ve como se verá después. */}
              <SubidorArchivo
                accept="image/*"
                maxMB={8}
                onArchivo={elegirArchivo}
                ajuste="cover"
                alto={140}
                altoPreview={180}
                radio={8}
                titulo="Arrastra tu foto o haz clic para elegirla"
                ayuda="JPG o PNG, hasta 8 MB"
                etiquetaAria="Subir foto de perfil"
              />
            </BloqueFoto>

            <BloqueConsentimiento>
              <Casilla>
                <input
                  type="checkbox"
                  id="aceptaTerminos"
                  /*
                    El nombre completo para quien no ve la pantalla. La etiqueta
                    visible se corta en "los" porque la frase sigue en el botón,
                    y un lector de pantalla anunciaría "acepto los" a secas —
                    una casilla que no dice qué se está aceptando.
                  */
                  aria-label="He leído y acepto los términos y el aviso de privacidad"
                  {...register('aceptaTerminos', {
                    required: 'Hay que aceptar los términos para crear la cuenta',
                  })}
                />
                <TextoCasilla>
                  <label htmlFor="aceptaTerminos">He leído y acepto los </label>
                  <EnlaceTerminos type="button" onClick={abrirTerminos}>
                    términos y el aviso de privacidad
                  </EnlaceTerminos>
                  .
                </TextoCasilla>
              </Casilla>
              {errors.aceptaTerminos && (
                <ErrorCasilla>{errors.aceptaTerminos.message}</ErrorCasilla>
              )}

              {/*
                Desmarcada por defecto y sin `required`. Es opcional de verdad:
                se puede crear la cuenta sin tocarla, y no se pierde nada de la
                tienda por no querer publicidad.
              */}
              <Casilla>
                <input type="checkbox" id="promociones" {...register('promociones')} />
                <label htmlFor="promociones">
                  Quiero recibir promociones y novedades por correo.
                  <Aclaracion>
                    Opcional. Puede desactivarlo cuando quiera desde Mi cuenta.
                  </Aclaracion>
                </label>
              </Casilla>
            </BloqueConsentimiento>

            <Button type="submit" disabled={cargando}>
              {cargando ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
            </Button>

          </form>

          <Divisor>o</Divisor>

          <GoogleFila>
            {entrandoGoogle ? (
              <Loader2 size={22} className="animate-spin" style={{ color: BROWN }} />
            ) : (
              <GoogleLogin
                onSuccess={onGoogle}
                onError={() => toast.error('No se pudo registrar con Google')}
                text="signup_with"
                shape="pill"
                locale="es"
                width="320"
              />
            )}
          </GoogleFila>

          <FooterText>
            ¿Ya tienes una cuenta?{' '}
            <FooterLink onClick={() => navigate('/iniciar-sesion')}>Iniciar Sesión</FooterLink>
          </FooterText>
        </Card>
      </Body>

      <ModalTerminos abierto={terminosAbiertos} onCerrar={cerrarTerminos} />
    </Container>
  );
};

export default Register;