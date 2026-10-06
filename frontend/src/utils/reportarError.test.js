import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/*
 * Avisar de un error nunca puede estorbar: solo en la tienda publicada, una
 * vez por error, como mucho diez por visita y sin red no se intenta.
 */

const cargar = async () => {
  vi.resetModules(); // cada prueba con su propia cuenta de enviados
  return import('./reportarError');
};

describe('reportar un error', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true);
    vi.stubGlobal('navigator', { onLine: true, userAgent: 'Chrome/126 Android' });
    vi.stubGlobal('window', { location: { pathname: '/producto/123' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('manda qué falló, dónde y en qué dispositivo, como texto plano y sin cookies', async () => {
    const { reportarError } = await cargar();
    reportarError(new Error('se rompió la ficha'));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toMatch(/\/errores$/);
    expect(opciones).toMatchObject({ method: 'POST', mode: 'no-cors', credentials: 'omit', keepalive: true });
    expect(JSON.parse(opciones.body)).toMatchObject({ origen: 'web', mensaje: 'se rompió la ficha', donde: '/producto/123' });
  });

  it('el mismo error en la misma pantalla se manda una sola vez', async () => {
    const { reportarError } = await cargar();
    reportarError(new Error('igual'));
    reportarError(new Error('igual'));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('una pantalla que falla en bucle no manda más de diez', async () => {
    const { reportarError } = await cargar();
    for (let i = 0; i < 50; i++) reportarError(new Error(`error ${i}`));
    expect(fetch).toHaveBeenCalledTimes(10);
  });

  it('en desarrollo y sin conexión no manda nada', async () => {
    const { reportarError } = await cargar();
    vi.stubEnv('PROD', false);
    reportarError(new Error('en mi compu'));
    vi.stubEnv('PROD', true);
    vi.stubGlobal('navigator', { onLine: false });
    reportarError(new Error('sin red'));
    expect(fetch).not.toHaveBeenCalled();
  });
});
