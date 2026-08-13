import { ChevronDown, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import ThemeSwitcher from './ThemeSwitcher';

const TopBar = ({ onAlternarMenu, menuAbierto = false }) => {
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
      className="h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-20 transition-colors duration-300"
      style={{ backgroundColor: c.topbarBg, borderBottom: `1px solid ${c.sidebarBorder}` }}
    >
      {/*
        La hamburguesa es la única puerta al menú en teléfono, así que se queda
        en la esquina donde el pulgar la busca. De 1024px para arriba el menú ya
        está a la vista y el botón sobra.
      */}
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={onAlternarMenu}
          aria-label="Abrir el menú"
          aria-expanded={menuAbierto}
          aria-controls="menu-panel"
          className="lg:hidden -ml-2 p-2 rounded-lg press"
          style={{ color: c.textPrimary }}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Selector de accesibilidad: paletas a un clic desde cualquier pantalla */}
        <ThemeSwitcher />

        {/* Separador sutil */}
        <div className="w-px h-8 hidden sm:block" style={{ backgroundColor: c.sidebarBorder }} />

        {/* Bloque del usuario logueado */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0">
          {/*
            El nombre se esconde en teléfono: entre la hamburguesa, el selector
            de paleta y la inicial no queda ancho, y un nombre largo empujaba la
            barra a lo ancho. La inicial y el rol se recuperan al tocar "Cuenta".
          */}
          <div className="text-right hidden sm:block min-w-0">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: c.textPrimary }}>{displayName}</p>
            <p className="text-xs truncate" style={{ color: c.textMuted }}>{roleLabel}</p>
          </div>
          <div
            className="h-10 w-10 flex-none rounded-full flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            {/* Su foto de perfil si la tiene; si no, las iniciales de siempre. */}
            {user?.image ? (
              <img src={user.image} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <ChevronDown className="w-4 h-4 flex-none" style={{ color: c.textMuted }} />
        </div>
      </div>
    </header>
  );
};

export default TopBar;

