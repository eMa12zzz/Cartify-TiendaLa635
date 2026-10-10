import { describe, it, expect } from 'vitest';
import { direccionConPase, esDelPanel, queHacerCon } from './panelWeb';

const WEB = 'https://cartify-tienda-la635.vercel.app';

describe('el panel web dentro de la app', () => {
  it('abre el panel con el pase y, si hace falta, a dónde volver', () => {
    expect(direccionConPase(WEB, 'abc123')).toBe(`${WEB}/admin/desde-app?pase=abc123`);
    expect(direccionConPase(WEB, 'abc123', '/inventario?vista=1')).toBe(
      `${WEB}/admin/desde-app?pase=abc123&volver=%2Finventario%3Fvista%3D1`
    );
  });

  it('si la sesión vence, vuelve a donde iba', () => {
    expect(queHacerCon(`${WEB}/admin?volver=%2Fpedidos`, WEB)).toEqual({ accion: 'vencio', volver: '/pedidos' });
  });

  it('si alguien cerró la sesión, lo sabe', () => {
    expect(queHacerCon(`${WEB}/admin`, WEB)).toEqual({ accion: 'cerro' });
    expect(queHacerCon(`${WEB}/admin/`, WEB)).toEqual({ accion: 'cerro' });
  });

  it('las demás pantallas siguen su camino', () => {
    expect(queHacerCon(`${WEB}/dashboard`, WEB)).toBeNull();
    expect(queHacerCon(`${WEB}/admin/desde-app`, WEB)).toBeNull();
    expect(queHacerCon('https://otra.com/admin', WEB)).toBeNull();
  });

  it('un volver que no es del panel no se sigue', () => {
    expect(queHacerCon(`${WEB}/admin?volver=https%3A%2F%2Fmalo.com`, WEB)).toEqual({ accion: 'cerro' });
  });

  it('lo que no es del panel se abre fuera', () => {
    expect(esDelPanel(`${WEB}/inventario`, WEB)).toBe(true);
    expect(esDelPanel('https://wa.me/50370000000', WEB)).toBe(false);
    expect(esDelPanel('mailto:hola@tienda.com', WEB)).toBe(false);
    expect(esDelPanel('about:blank', WEB)).toBe(true);
  });
});
