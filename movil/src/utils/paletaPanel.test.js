import { describe, it, expect } from 'vitest';
import { paletaDesdePanel } from './paletaPanel';

// La paleta "Calma noche" del panel, tal como la manda la web.
const CALMA_NOCHE = {
  id: 'calma-noche',
  oscuro: true,
  colores: {
    primary: '#8FB3C0', primaryHover: '#A5C3CE', primaryLight: 'rgba(143, 179, 192, 0.14)', accent: '#9DBBA9',
    accentText: '#9DBBA9', buttonText: '#1F2226', sidebarBg: '#1B1E21', sidebarText: '#D5D1C8',
    sidebarBorder: '#30353B', topbarBg: '#23272B', mainBg: '#1F2226', cardBg: '#282C31', cardBorder: '#363B42',
    textPrimary: '#E4E0D8', textSecondary: '#C2BDB3', textMuted: '#A7A298', peligro: '#E3A69C',
    aviso: '#D9BF86', exito: '#A9CBA6',
  },
};

describe('la paleta del panel en la app', () => {
  it('pinta el modo del personal con los colores del panel', () => {
    const p = paletaDesdePanel(CALMA_NOCHE);
    expect(p.clave).toBe('panel-calma-noche');
    expect(p.colores.oscuro).toBe(true);
    expect(p.colores.fondo).toBe('#1F2226');
    expect(p.colores.tituloFuerte).toBe('#E4E0D8');
    expect(p.colores.sobreMarca).toBe('#1F2226');
    expect(p.marca.marca).toBe('#8FB3C0');
    // Lo que el panel no trae sale de la paleta oscura de la app, no queda vacío.
    expect(p.colores.velo).toBeTruthy();
  });

  it('"Mi marca" es la de siempre: no cambia nada', () => {
    expect(paletaDesdePanel({ ...CALMA_NOCHE, id: 'marca' })).toBeNull();
  });

  it('lo que no es un color no se pinta', () => {
    expect(paletaDesdePanel({ ...CALMA_NOCHE, colores: { ...CALMA_NOCHE.colores, mainBg: 'url(javascript:alert(1))' } })).toBeNull();
    expect(paletaDesdePanel({ ...CALMA_NOCHE, id: '<script>' })).toBeNull();
    expect(paletaDesdePanel(null)).toBeNull();
  });
});
