import { createContext, useContext, useState, useEffect } from 'react';

/**
 * 5 accessibility-oriented palettes designed for neurological conditions:
 *
 * 1. Default        — original warm brown/gold (baseline)
 * 2. High Contrast  — black/yellow for low-vision & ADHD focus
 * 3. Deuteranopia   — blue/orange safe for red-green color blindness
 * 4. Tritanopia     — red/cyan safe for blue-yellow color blindness
 * 5. Dark Mode      — low-light, reduced stimulation for migraines & photosensitivity
 */

export const palettes = [
  {
    id: 'default',
    name: 'Predeterminado',
    description: 'Paleta original cálida',
    colors: {
      primary: '#B47C4D',
      primaryHover: '#9C6026',
      primaryLight: 'rgba(180, 124, 77, 0.1)',
      accent: '#C28C5D',
      buttonText: '#FFFFFF',
      sidebarBg: '#FFFFFF',
      sidebarText: '#374151',
      sidebarBorder: '#E5E7EB',
      topbarBg: '#FFFFFF',
      mainBg: '#F8F9FA',
      cardBg: '#FFFFFF',
      cardBorder: '#F3F4F6',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      textMuted: '#9CA3AF',
    },
    swatches: ['#B47C4D', '#C28C5D', '#F8F9FA', '#FFFFFF', '#1F2937'],
  },
  {
    id: 'high-contrast',
    name: 'Alto Contraste',
    description: 'Baja visión · TDAH · Enfoque',
    colors: {
      primary: '#FFD600',
      primaryHover: '#FFC107',
      primaryLight: 'rgba(255, 214, 0, 0.15)',
      accent: '#FFD600',
      buttonText: '#000000',
      sidebarBg: '#000000',
      sidebarText: '#FFFFFF',
      sidebarBorder: '#333333',
      topbarBg: '#000000',
      mainBg: '#1A1A1A',
      cardBg: '#000000',
      cardBorder: '#444444',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textMuted: '#BDBDBD',
    },
    swatches: ['#FFD600', '#000000', '#1A1A1A', '#FFFFFF', '#444444'],
  },
  {
    id: 'deuteranopia',
    name: 'Deuteranopía',
    description: 'Daltonismo rojo-verde',
    colors: {
      primary: '#0077BB',
      primaryHover: '#005588',
      primaryLight: 'rgba(0, 119, 187, 0.1)',
      accent: '#EE7733',
      buttonText: '#FFFFFF',
      sidebarBg: '#FAFBFC',
      sidebarText: '#2D3748',
      sidebarBorder: '#E2E8F0',
      topbarBg: '#FFFFFF',
      mainBg: '#F7FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textPrimary: '#1A202C',
      textSecondary: '#4A5568',
      textMuted: '#A0AEC0',
    },
    swatches: ['#0077BB', '#EE7733', '#F7FAFC', '#FFFFFF', '#1A202C'],
  },
  {
    id: 'tritanopia',
    name: 'Tritanopía',
    description: 'Daltonismo azul-amarillo',
    colors: {
      primary: '#CC3311',
      primaryHover: '#AA2200',
      primaryLight: 'rgba(204, 51, 17, 0.1)',
      accent: '#009988',
      buttonText: '#FFFFFF',
      sidebarBg: '#FAF9F7',
      sidebarText: '#3D3D3D',
      sidebarBorder: '#E0DFDD',
      topbarBg: '#FFFFFF',
      mainBg: '#F5F4F2',
      cardBg: '#FFFFFF',
      cardBorder: '#E0DFDD',
      textPrimary: '#1C1C1C',
      textSecondary: '#555555',
      textMuted: '#999999',
    },
    swatches: ['#CC3311', '#009988', '#F5F4F2', '#FFFFFF', '#1C1C1C'],
  },
  {
    id: 'dark',
    name: 'Modo Oscuro',
    description: 'Migrañas · Fotosensibilidad',
    colors: {
      primary: '#A78BFA',
      primaryHover: '#8B5CF6',
      primaryLight: 'rgba(167, 139, 250, 0.15)',
      accent: '#A78BFA',
      buttonText: '#FFFFFF',
      sidebarBg: '#111827',
      sidebarText: '#D1D5DB',
      sidebarBorder: '#1F2937',
      topbarBg: '#111827',
      mainBg: '#0F172A',
      cardBg: '#1E293B',
      cardBorder: '#334155',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
    },
    swatches: ['#A78BFA', '#111827', '#0F172A', '#1E293B', '#F1F5F9'],
  },
];

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [paletteId, setPaletteId] = useState(() => {
    return localStorage.getItem('theme-palette') || 'default';
  });

  const palette = palettes.find((p) => p.id === paletteId) || palettes[0];

  useEffect(() => {
    localStorage.setItem('theme-palette', paletteId);

    // Apply CSS custom properties to :root
    const root = document.documentElement;
    Object.entries(palette.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, [paletteId, palette]);

  return (
    <ThemeContext.Provider value={{ palette, paletteId, setPaletteId, palettes }}>
      {children}
    </ThemeContext.Provider>
  );
};
