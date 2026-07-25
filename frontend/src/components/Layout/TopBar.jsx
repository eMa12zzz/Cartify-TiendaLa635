import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import ThemeSwitcher from './ThemeSwitcher';

const TopBar = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { user } = useAuth();

  // Mostramos al usuario realmente logueado (antes había un placeholder fijo).
  const displayName = user?.userName || user?.fullnName || 'Usuario';
  const roleLabel =
    user?.type === 'admin' ? 'Administrador' :
    user?.type === 'employee' ? 'Empleado' : 'Sesión activa';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header
      className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300"
      style={{ backgroundColor: c.topbarBg, borderBottom: `1px solid ${c.sidebarBorder}` }}
    >
      <div className="flex-1"></div>

      <div className="flex items-center gap-3">
        {/* Selector de accesibilidad: paletas a un clic desde cualquier pantalla */}
        <ThemeSwitcher />

        {/* Separador sutil */}
        <div className="w-px h-8" style={{ backgroundColor: c.sidebarBorder }} />

        {/* Bloque del usuario logueado */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: c.textPrimary }}>{displayName}</p>
            <p className="text-xs" style={{ color: c.textMuted }}>{roleLabel}</p>
          </div>
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            {initials}
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: c.textMuted }} />
        </div>
      </div>
    </header>
  );
};

export default TopBar;

