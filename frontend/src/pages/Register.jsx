import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Phone, User, Hash, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BotonOjo } from '../components/UI/CampoContrasena';
import SubidorArchivo from '../components/UI/SubidorArchivo';
import { reglaDuiOpcional, reglaTelefono, bloquearNoDigitos } from '../utils/validaciones';
import { formatearDui, formatearTelefono, LARGO_DUI, LARGO_TELEFONO } from '../utils/mascaras';
import api from '../api/api';

const BROWN = '#B46C30';
const BROWN_HOVER = '#8A5222';

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
    box-shadow: 0 0 0 3px rgba(139,90,43,0.08);
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
    background: #d8c5af;
    cursor: not-allowed;
  }
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

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // 1- Manejar la selección de archivo de imagen
  // La preview y las validaciones las hace SubidorArchivo; aquí solo guardamos
  // el archivo tal cual, que es lo que se adjunta al FormData más abajo.
  const handleFileChange = (file) => setSelectedFile(file);

  // 2- Enviar datos al backend
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('fullName', data.fullName); // El backend espera 'fullName'
      /*
       * El DUI solo viaja si la persona lo escribió. Mandar la cadena vacía
       * dejaría a todos los que no lo pusieron guardados con el mismo valor
       * "", y el día que alguien busque por DUI o le ponga un índice único al
       * campo, eso se convierte en un problema.
       */
      if (data.dui?.trim()) formData.append('dui', data.dui.trim());
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('email', data.email);
      formData.append('userName', data.userName);
      formData.append('password', data.password);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      // 3- Llamada a la API de registro
      const response = await api.post('/registerClient', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`¡Código enviado a ${data.email}! Revisa tu bandeja de entrada.`, {
        duration: 5000,
      });
      
      // Guardar el flujo y el correo para que Verification sepa qué mostrar y qué endpoint llamar
      localStorage.setItem('verificationFlow', 'register');
      localStorage.setItem('tempIdentifier', data.email);
      navigate('/verification');

    } catch (error) {
      console.error(error);
      // El toast de error lo maneja el interceptor en api.js
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
          <SectionTitle>Regístrate</SectionTitle>

          <form onSubmit={handleSubmit(onSubmit)}>
            
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
              El DUI es opcional: quien no lo anda a mano igual se registra hoy.
              Solo se revisa si escribió algo (ver reglaDuiOpcional).
            */}
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
                onArchivo={handleFileChange}
                ajuste="cover"
                alto={140}
                altoPreview={180}
                radio={8}
                titulo="Arrastra tu foto o haz clic para elegirla"
                ayuda="JPG o PNG, hasta 8 MB"
                etiquetaAria="Subir foto de perfil"
              />
            </BloqueFoto>

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
            </Button>

          </form>

          <FooterText>
            ¿Ya tienes una cuenta?{' '}
            <FooterLink onClick={() => navigate('/iniciar-sesion')}>Iniciar Sesión</FooterLink>
          </FooterText>
        </Card>
      </Body>
    </Container>
  );
};

export default Register;