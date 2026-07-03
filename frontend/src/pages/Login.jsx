import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loginStep1 } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // Limpiar sesión previa si el usuario entra al login
  useEffect(() => {
    logout();
  }, [logout]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await loginStep1({ email: data.email, password: data.password });
      
      localStorage.setItem('tempIdentifier', data.email);
      localStorage.setItem('tempMethod', 'email');
      localStorage.setItem('pendingToken', res.pendingToken);
      
      toast.success('Credenciales validadas. Redirigiendo a verificación...', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      navigate('/verification');
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas', {
        style: {
          borderRadius: '10px',
          background: '#ff4d4f',
          color: '#fff',
        },
      });
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
            <p className="text-gray-500 text-sm font-medium">Inicia sesión en tu cuenta</p>
            <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
              ¡Bienvenido de nuevo! Por favor, introduzca sus datos.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo</label>
              <input
                type="email"
                placeholder="Introduce tu correo electrónico"
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#B47C4D] focus:ring-[#B47C4D]'} focus:outline-none focus:ring-1 transition-colors text-sm`}
                {...register('email', { 
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: 'Formato de correo inválido'
                  }
                })}
              />
              {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#B47C4D] focus:ring-[#B47C4D]'} focus:outline-none focus:ring-1 transition-colors text-sm tracking-widest`}
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
              />
              {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-[#B47C4D] focus:ring-[#B47C4D]"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-gray-600">Recuerda durante 30 días</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-[#B47C4D] hover:text-[#9C6026] font-medium transition-colors"
              >
                Has olvidado tu contraseña
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#C28C5D] hover:bg-[#A36B3D] text-white rounded-lg text-sm font-semibold transition-colors mt-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-[#B47C4D] hover:text-[#9C6026] font-semibold transition-colors">
                Registrarse
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;