import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRecover = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingrese su correo electrónico.');
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('Si el correo existe, se enviará un enlace de recuperación en breve.');
    // Simulate API delay and redirect
    setTimeout(() => {
      navigate('/');
    }, 3000);
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

          <form onSubmit={handleRecover} className="w-full space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-200">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo</label>
              <input
                type="email"
                placeholder="Introduce tu correo electrónico"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#B47C4D] focus:ring-1 focus:ring-[#B47C4D] transition-colors text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#C28C5D] hover:bg-[#A36B3D] text-white rounded-lg text-sm font-semibold transition-colors mt-6 shadow-sm"
            >
              Recuperar contraseña
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
