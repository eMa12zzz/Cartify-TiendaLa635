import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginStep1 } from '../api/authApi';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingrese sus datos completos.');
      return;
    }
    
    try {
      setLoading(true);
      const res = await loginStep1({ email, password });
      
      localStorage.setItem('tempIdentifier', email);
      localStorage.setItem('tempMethod', 'email');
      localStorage.setItem('pendingToken', res.pendingToken);
      
      navigate('/verification');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
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

          <form onSubmit={handleLogin} className="w-full space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo</label>
              <input
                type="email"
                placeholder="Introduce tu correo electrónico"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#B47C4D] focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#B47C4D] focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm tracking-widest"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-[#B47C4D] focus:ring-[#B47C4D]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
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
              className="w-full py-3 px-4 bg-[#C28C5D] hover:bg-[#A36B3D] text-white rounded-lg text-sm font-semibold transition-colors mt-6 shadow-sm disabled:opacity-50"
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