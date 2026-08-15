import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loginAdminDB, verify2FAAdmin } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import CampoContrasena from '../components/UI/CampoContrasena';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  /*
   * El login es de DOS pasos por el 2FA:
   *   'credenciales' → correo + contraseña.
   *   'codigo'       → el código que llegó al correo.
   */
  const [paso, setPaso] = useState('credenciales');
  const [correoEnm, setCorreoEnm] = useState(''); // correo enmascarado, para el aviso
  const [codigo, setCodigo] = useState('');

  /*
   * 1- Limpiar la sesión previa DEL PERSONAL al entrar a su login.
   *
   * El área va dicha a la letra y no se deduce de la ruta: así queda claro
   * que entrar por esta puerta no roza la sesión de cliente que la misma
   * persona tenga abierta en la tienda. Ver AuthContext.
   */
  useEffect(() => {
    logout('personal');
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

  /*
   * Lo que pasa una vez que la sesión SÍ se abrió (tras verificar el código).
   * De vuelta a donde iba, no siempre al Dashboard: ProtectedRoute manda aquí
   * con ?volver=/inventario. `replace` para que el login no quede en el
   * historial y el "atrás" no regrese a esta pantalla.
   */
  const entrar = (res) => {
    login(res.token, 'admin', res.admin);
    toast.success('¡Bienvenido! Inicio de sesión exitoso', {
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
    const volver = new URLSearchParams(window.location.search).get('volver');
    navigate(volver && volver.startsWith('/') ? volver : '/dashboard', { replace: true });
  };

  // PASO 1 — correo + contraseña. Si están bien, el backend manda el código y
  // se pasa al paso del código; la sesión todavía no se abre.
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await loginAdminDB({ email: data.email, password: data.password });
      if (res.needs2FA) {
        setCorreoEnm(res.email || '');
        setCodigo('');
        setPaso('codigo');
        toast.success('Le enviamos un código a su correo', {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      } else if (res.token) {
        // Respaldo por si el backend algún día devuelve sesión directa.
        entrar(res);
      }
    } catch (err) {
      toast.error(err.message || 'Credenciales inválidas o cuenta bloqueada', {
        style: { borderRadius: '10px', background: '#ff4d4f', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  // PASO 2 — verificar el código. Si coincide, ahí sí se abre la sesión.
  const onVerificar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    try {
      setLoading(true);
      const res = await verify2FAAdmin({ code: codigo.trim() });
      entrar(res);
    } catch (err) {
      toast.error(err.message || 'El código no es correcto', {
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
              {paso === 'credenciales'
                ? 'Ingresa tus credenciales de administrador para continuar.'
                : `Escribe el código que enviamos a ${correoEnm || 'tu correo'}.`}
            </p>
          </div>

          {paso === 'credenciales' ? (
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
              <CampoContrasena
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
          ) : (
          <form onSubmit={onVerificar} className="w-full space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código del correo</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="6 dígitos"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#B47C4D] focus:outline-none focus:ring-1 focus:ring-[#B47C4D] transition-colors text-center text-lg tracking-[6px] font-bold"
              />
              <p className="text-xs text-gray-400 mt-2">El código vence en 10 minutos.</p>
            </div>

            <button
              type="submit"
              disabled={loading || codigo.length < 6}
              className="w-full py-3 px-4 bg-[#C28C5D] hover:bg-[#A36B3D] text-white rounded-lg text-sm font-semibold transition-colors mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar y entrar'}
            </button>

            <button
              type="button"
              onClick={() => { setPaso('credenciales'); setCodigo(''); }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 font-semibold"
            >
              ← Volver e intentar con otra cuenta
            </button>
          </form>
          )}

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
