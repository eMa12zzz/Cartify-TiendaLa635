import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loginAdminDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // 1- Limpiar sesión previa al entrar al login de administrador
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

  // 2- Enviar credenciales al backend de administradores (SELECT y VERIFY)
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // 3- Validamos con el backend de administradores
      const res = await loginAdminDB({ email: data.email, password: data.password });
      // 4- Guardamos el token real y los datos del admin en el contexto
      login(res.token, 'admin', res.admin);
      toast.success('¡Bienvenido! Inicio de sesión exitoso', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas o cuenta bloqueada', {
        style: { borderRadius: '10px', background: '#ff4d4f', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Columna izquierda - Imagen */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-100">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop"
          alt="Tienda"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Columna derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md flex flex-col items-center">

          {/* Logo / Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-black leading-tight mb-4 tracking-tight">
              Tienda<br />la 635
            </h1>
            <p className="text-gray-500 text-sm font-medium">Panel Administrativo</p>
            <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
              Ingresa tus credenciales de administrador para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo</label>
              <input
                type="email"
                placeholder="Introduce tu correo electrónico"
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-[#B47C4D]'} focus:outline-none focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm`}
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
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-[#B47C4D]'} focus:outline-none focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm tracking-widest`}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
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
              ¿Eres cliente?{' '}
              <a href="/" className="text-[#B47C4D] hover:text-[#9C6026] font-semibold transition-colors">
                Ir a la tienda
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
