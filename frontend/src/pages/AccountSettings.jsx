import { useState, useEffect } from 'react';
import { useTheme, palettes } from '../context/ThemeContext';
import { Check, Palette, User, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AccountSettings = () => {
  const { paletteId, setPaletteId, palette } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userType = user?.type || 'employee';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [formData, setFormData] = useState({
    fullnName: user?.fullnName || '',
    userName: user?.userName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    dui: user?.dui || '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'theme', label: 'Paleta de Colores', icon: Palette },
  ];

  return (
    <div className="flex-1 w-full max-w-5xl pb-10" style={{ backgroundColor: 'var(--theme-main-bg)' }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>Cuenta</h1>
        <div className="flex items-center gap-4">
          <div className="text-xs px-3 py-1 rounded-full font-medium capitalize" 
               style={{ backgroundColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }}>
            Vista: {userType === 'admin' ? 'Administrador' : 'Empleado'}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-colors border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 mb-8 border-b pb-0" style={{ borderColor: 'var(--theme-card-border)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2"
              style={{
                borderColor: isActive ? 'var(--theme-primary)' : 'transparent',
                color: isActive ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                backgroundColor: isActive ? 'var(--theme-primary-light)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* === TAB: Mi Perfil === */}
      {activeTab === 'profile' && (
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 max-w-2xl">
            <form className="space-y-6">
              {userType === 'employee' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Nombre Completo</label>
                  <input type="text" name="fullnName" value={formData.fullnName} onChange={handleChange}
                    className="w-full px-5 py-2.5 rounded-full border focus:outline-none transition-colors"
                    style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Nombre de usuario</label>
                <input type="text" name="userName" value={formData.userName} onChange={handleChange}
                    className="w-full px-5 py-2.5 rounded-full border focus:outline-none transition-colors"
                    style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
              </div>

              <div className="space-y-2 relative">
                <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Correo electrónico</label>
                <div className="relative">
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-5 py-2.5 rounded-full border focus:outline-none pr-12 transition-colors"
                    style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
                  <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {userType === 'employee' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Teléfono</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                        className="w-full px-5 py-2.5 rounded-full border focus:outline-none transition-colors"
                        style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>DUI</label>
                    <input type="text" name="dui" value={formData.dui} onChange={handleChange}
                      className="w-full px-5 py-2.5 rounded-full border focus:outline-none transition-colors"
                      style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
                  </div>
                </>
              )}

              <div className="space-y-2 relative">
                <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Contraseña</label>
                <div className="relative">
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                    className="w-full px-5 py-2.5 rounded-full border focus:outline-none pr-12 tracking-wider transition-colors"
                    style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }} />
                  <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button type="button"
                  className="px-8 py-2 rounded-full border-2 font-medium transition-colors"
                  style={{ borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }}>
                  Cambiar datos
                </button>
                <button type="button"
                  className="px-10 py-2.5 rounded-full font-bold shadow-sm transition-colors"
                  style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-button-text)' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>

          {/* Profile Image Column */}
          <div className="flex-none pt-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-md mx-auto"
                 style={{ backgroundColor: 'var(--theme-card-border)', color: 'var(--theme-text-primary)' }}>
              <span className="text-3xl font-bold uppercase opacity-50">
                {formData.userName ? formData.userName.substring(0, 2) : 'U'}
              </span>
            </div>
            <p className="text-center text-xs mt-4 cursor-pointer hover:underline" style={{ color: 'var(--theme-text-secondary)' }}>
              Cambiar avatar
            </p>
          </div>
        </div>
      )}

      {/* === TAB: Paleta de Colores === */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
          <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            Selecciona una paleta de colores para personalizar la interfaz del panel de administración. 
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {palettes.map((p) => {
              const isActive = paletteId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  className="relative p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] cursor-pointer"
                  style={{
                    borderColor: isActive ? p.colors.primary : 'var(--theme-card-border)',
                    backgroundColor: isActive ? p.colors.primaryLight : 'transparent',
                    boxShadow: isActive ? `0 0 0 1px ${p.colors.primary}` : 'none',
                  }}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: p.colors.primary }}>
                      <Check className="w-4 h-4" style={{ color: p.colors.buttonText }} />
                    </div>
                  )}

                  {/* Swatches */}
                  <div className="flex gap-2 mb-4">
                    {p.swatches.map((color, i) => (
                      <div key={i} className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{p.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
