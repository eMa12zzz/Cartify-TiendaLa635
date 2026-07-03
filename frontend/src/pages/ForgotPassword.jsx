import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../api/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // 1- Enviar la solicitud de recuperación
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // 2- Llamada al backend
      const response = await api.post('/recoveryPasswordClient/requestCode', {
        email: data.email
      });

      toast.success(response.data.message || 'Se enviará un código a tu correo si existe.');
      
      // Guardar flujo para que Verification sepa
      localStorage.setItem('verificationFlow', 'recovery');
      
      // Simular delay y navegar
      setTimeout(() => {
        navigate('/verification');
      }, 1500);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-100">
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
          alt="Fruits" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Logo / Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-black leading-tight mb-4 tracking-tight">
              Tienda<br />la 635
            </h1>
            <p className="text-gray-500 text-sm font-medium">Recuperar contraseña</p>
            <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
              Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5 relative">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo</label>
              <input
                type="email"
                placeholder="Introduce tu correo electrónico"
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#B47C4D] focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm`}
                {...register("email", { 
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Formato de correo inválido"
                  }
                })}
              />
              {errors.email && (
                <span className="text-red-500 text-xs mt-1 block absolute">
                  {errors.email.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#C28C5D] hover:bg-[#A36B3D] text-white rounded-lg text-sm font-semibold transition-colors mt-6 shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Recuperar contraseña'}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              ¿Ya la recordaste?{' '}
              <Link to="/" className="text-[#B47C4D] hover:text-[#9C6026] font-semibold transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
