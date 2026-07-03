import { Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TopBar = () => {
  const { palette } = useTheme();
  const c = palette.colors;

  return (
    <header
      className="h-20 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300"
      style={{ backgroundColor: c.mainBg }}
    >
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5" style={{ color: c.primary }} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-transparent sm:text-sm outline-none"
            placeholder="Ej: José, 012345678-9"
            style={{
              border: `1px solid ${c.cardBorder}`,
              color: c.textPrimary,
              caretColor: c.primary,
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight" style={{ color: c.textPrimary }}>Ema PesoPluma69</p>
          <p className="text-xs" style={{ color: c.textMuted }}>SV</p>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="avatar-fixed h-10 w-10 rounded-full" style={{ backgroundColor: '#374151' }}></div>
          <ChevronDown className="w-4 h-4" style={{ color: c.textMuted }} />
        </div>
      </div>
    </header>
  );
};

export default TopBar;

