// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Errores from './Errores';
import { errorService } from '../api/errorService';

/*
 * La pantalla del panel donde se ven los errores. El servidor es de mentira:
 * se reemplaza errorService para no depender de la base ni de una sesión.
 */

vi.mock('../api/errorService', () => ({
  errorService: { listar: vi.fn(), marcar: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const ERROR = {
  _id: 'e1',
  origen: 'web',
  mensaje: "Cannot read properties of undefined (reading 'precio')",
  donde: '/producto/:id',
  veces: 37,
  primeraVez: '2026-10-05T10:00:00.000Z',
  ultimaVez: new Date().toISOString(),
  version: 'abc123',
  dispositivo: 'Chrome 126 · Android',
  pila: 'TypeError: …\n    at Ficha (ProductDetailModal.jsx)',
  resuelto: false,
};

describe('pantalla de errores', () => {
  beforeEach(() => {
    errorService.listar.mockResolvedValue({ errores: [ERROR], abiertos: 1 });
    errorService.marcar.mockResolvedValue({ ...ERROR, resuelto: true });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('muestra cada error con dónde pasó y cuántas veces', async () => {
    render(<Errores />);
    expect(await screen.findByText(ERROR.mensaje)).toBeTruthy();
    expect(screen.getByText('/producto/:id')).toBeTruthy();
    expect(screen.getByText(/37 veces/)).toBeTruthy();
    expect(screen.getByText('Por revisar (1)')).toBeTruthy();
    expect(errorService.listar).toHaveBeenCalledWith('abiertos');
  });

  it('el detalle enseña la versión, el dispositivo y la pila', async () => {
    render(<Errores />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }));
    expect(screen.getByText('Versión: abc123')).toBeTruthy();
    expect(screen.getByText('Dispositivo: Chrome 126 · Android')).toBeTruthy();
    expect(screen.getByText(/at Ficha/)).toBeTruthy();
  });

  it('marcarlo como resuelto lo saca de la lista', async () => {
    render(<Errores />);
    await screen.findByText(ERROR.mensaje);
    // Exacto: "Resuelto" es el botón del renglón; "Resueltos" es la pestaña.
    fireEvent.click(screen.getByRole('button', { name: 'Resuelto' }));
    await waitFor(() => expect(screen.queryByText(ERROR.mensaje)).toBeNull());
    expect(errorService.marcar).toHaveBeenCalledWith('e1', true);
    expect(screen.getByText('Nada por revisar')).toBeTruthy();
  });

  it('la pestaña de resueltos pide los resueltos', async () => {
    errorService.listar.mockResolvedValue({ errores: [], abiertos: 0 });
    render(<Errores />);
    fireEvent.click(await screen.findByRole('button', { name: 'Resueltos' }));
    await waitFor(() => expect(errorService.listar).toHaveBeenLastCalledWith('resueltos'));
    expect(await screen.findByText('Todavía no hay errores resueltos')).toBeTruthy();
  });
});
