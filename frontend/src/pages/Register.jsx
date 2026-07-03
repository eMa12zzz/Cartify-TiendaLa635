import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Mail, Phone, User, Hash, MapPin, Lock, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

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

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  border: 1.5px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: ${BROWN};
  }
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
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // 1- Manejar la selección de archivo de imagen
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 2- Enviar datos al backend
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('fullName', data.fullName); // El backend espera 'fullName'
      formData.append('dui', data.dui);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('ClientAddress', data.clientAddress);
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

            <InputContainer>
              <Label>DUI</Label>
              <InputWrapper>
                <IconWrapper><Hash size={18} /></IconWrapper>
                <Input
                  type="text"
                  placeholder="00000000-0"
                  {...register("dui", { required: "El DUI es obligatorio" })}
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
                  placeholder="7000-0000"
                  {...register("phoneNumber", { required: "El teléfono es obligatorio" })}
                />
                {errors.phoneNumber && <ErrorMsg>{errors.phoneNumber.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            <InputContainer>
              <Label>Dirección</Label>
              <InputWrapper>
                <IconWrapper><MapPin size={18} /></IconWrapper>
                <Input
                  type="text"
                  placeholder="San Salvador, El Salvador"
                  {...register("clientAddress", { required: "La dirección es obligatoria" })}
                />
                {errors.clientAddress && <ErrorMsg>{errors.clientAddress.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

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
                  type="password"
                  placeholder="********"
                  {...register("password", { 
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                  })}
                />
                {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
              </InputWrapper>
            </InputContainer>

            <Label>Foto de Perfil (Opcional)</Label>
            <FileInputWrapper onClick={() => fileInputRef.current?.click()}>
              <Camera size={20} color={BROWN} />
              <span style={{ fontSize: 14, color: '#555' }}>
                {selectedFile ? selectedFile.name : 'Haz clic para subir una imagen...'}
              </span>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </FileInputWrapper>

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar'}
            </Button>

          </form>

          <FooterText>
            ¿Ya tienes una cuenta?{' '}
            <FooterLink onClick={() => navigate('/')}>Iniciar Sesión</FooterLink>
          </FooterText>
        </Card>
      </Body>
    </Container>
  );
};

export default Register;