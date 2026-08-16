import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../api/api';
import { BotonOjo } from '../components/UI/CampoContrasena';

const BROWN = 'var(--marca-600)';

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
  border: 1.5px solid ${({ $error }) => ($error ? '#ff4d4f' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
  outline: none;
  color: #000;
  margin-bottom: 8px;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${BROWN};
  }
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 16px;
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
  margin-top: 10px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: #00283D;
  }
  
  &:disabled {
    background: #C9D4DB;
    cursor: not-allowed;
  }
`;

const CreatePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirma, setVerConfirma] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  // 1- Observamos el valor de la nueva contraseña para validar la confirmación
  const newPassword = watch("newPassword");

  // 2- Enviar datos al backend
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // 3- Llamada a la API para actualizar la contraseña
      await api.post('/recoveryPasswordClient/newPassword', {
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword
      });

      toast.success('¡Contraseña actualizada con éxito!');
      
      // Limpiamos los rastros y redirigimos a iniciar sesión
      localStorage.removeItem('verificationFlow');
      navigate('/iniciar-sesion');

    } catch (error) {
      console.error(error);
      // Los toasts de error los muestra el interceptor de api.js
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
          <BackButton onClick={() => navigate('/verification')}>←</BackButton>

          <SectionTitle>Crea una contraseña</SectionTitle>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            <Label>Nueva Contraseña</Label>
            {/* Con el ojo se puede revisar antes de mandar: en esta pantalla
                un dedazo se descubre hasta el próximo inicio de sesión. */}
            <div style={{ position: 'relative' }}>
              <Input
                type={verNueva ? 'text' : 'password'}
                placeholder="Nueva Contraseña"
                style={{ paddingRight: 44 }}
                $error={!!errors.newPassword}
                {...register("newPassword", {
                  required: "La contraseña es obligatoria",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" }
                })}
              />
              <BotonOjo visible={verNueva} onToggle={() => setVerNueva((v) => !v)} />
            </div>
            {errors.newPassword && <ErrorMsg>{errors.newPassword.message}</ErrorMsg>}

            <Label>Confirmar Contraseña</Label>
            <div style={{ position: 'relative' }}>
              <Input
                type={verConfirma ? 'text' : 'password'}
                placeholder="Confirmar Contraseña"
                style={{ paddingRight: 44 }}
                $error={!!errors.confirmNewPassword}
                {...register("confirmNewPassword", {
                  required: "Debe confirmar la contraseña",
                  validate: value => value === newPassword || "Las contraseñas no coinciden"
                })}
              />
              <BotonOjo visible={verConfirma} onToggle={() => setVerConfirma((v) => !v)} />
            </div>
            {errors.confirmNewPassword && <ErrorMsg>{errors.confirmNewPassword.message}</ErrorMsg>}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Restablecer Contraseña →'}
            </Button>

          </form>
        </Card>
      </Body>
    </Container>
  );
};

export default CreatePassword;