import { useState } from 'react';
import { useTheme, palettes } from '../context/ThemeContext';
import { Check, Palette, Eye } from 'lucide-react';

const AccountSettings = () => {
  const { paletteId, setPaletteId, palette } = useTheme();

  return (
    <div className="flex flex-col gap-8 w-full pb-8">
      <h1 className="text-4xl font-extrabold" style={{ color: palette.colors.accent }}>Cuenta</h1>

      {/* Color Palette Section */}
      <div
        className="p-6 rounded-2xl shadow-sm border"
        style={{
          backgroundColor: palette.colors.cardBg,
          borderColor: palette.colors.cardBorder,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5" style={{ color: palette.colors.primary }} />
          <h3 className="text-xl font-bold" style={{ color: palette.colors.textPrimary }}>
            Paleta de Colores
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: palette.colors.textSecondary }}>
          Selecciona una paleta de colores adaptada a tus necesidades visuales.
          Estas paletas están diseñadas para mejorar la accesibilidad para personas con diversas condiciones neurológicas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {palettes.map((p) => {
            const isActive = paletteId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPaletteId(p.id)}
                className="relative text-left rounded-xl border-2 p-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  borderColor: isActive ? p.colors.primary : '#E5E7EB',
                  backgroundColor: isActive ? p.colors.primaryLight : '#FFFFFF',
                  boxShadow: isActive ? `0 0 0 1px ${p.colors.primary}` : 'none',
                }}
              >
                {/* Active badge */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: p.colors.primary }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Swatches */}
                <div className="flex gap-1.5 mb-3">
                  {p.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Name */}
                <h4 className="text-sm font-bold mb-0.5" style={{ color: p.colors.textPrimary }}>
                  {p.name}
                </h4>
                <p className="text-xs" style={{ color: p.colors.textSecondary }}>
                  {p.description}
                </p>

                {/* Preview bar */}
                <div
                  className="mt-3 h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${p.colors.primary}, ${p.colors.accent || p.colors.primary})`,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: palette.colors.primaryLight }}>
          <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: palette.colors.primary }} />
          <div>
            <p className="text-sm font-medium" style={{ color: palette.colors.textPrimary }}>
              Vista previa en tiempo real
            </p>
            <p className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
              Los cambios de paleta se aplican inmediatamente en toda la interfaz.
              Tu preferencia se guarda automáticamente en el navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
