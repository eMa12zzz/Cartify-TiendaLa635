import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/*
 * ============================================================
 * VOLVER — useVolver.js
 * ============================================================
 * El "atrás" de la app, que no es el del navegador.
 *
 * El requisito del proyecto pide navegación fluida "evitando tener que
 * utilizar el retroceder por defecto del navegador". Hay razones de sobra:
 * en el teléfono esa flecha queda lejos del pulgar, en el kiosco directamente
 * no existe, y en pantalla completa tampoco se ve.
 *
 * Lo que este hook resuelve y un `navigate(-1)` suelto no: qué pasa cuando NO
 * hay a dónde volver. Si alguien llegó por un enlace de WhatsApp, esa pantalla
 * es la primera de su visita; retroceder lo sacaría de la tienda hacia el
 * chat. React Router marca esa primera entrada con `key === 'default'`, y ahí
 * el botón lleva a casa en vez de al vacío.
 *
 * Y "casa" no es la misma para todos: el encargado que se equivocó de
 * dirección quiere el panel, no la portada de productos.
 * ============================================================
 */
export const useVolver = (destinoPorDefecto) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, esCliente } = useAuth();

  // Personal = tiene sesión pero no es cliente.
  const casa = destinoPorDefecto || (isAuthenticated && !esCliente ? '/dashboard' : '/store');

  /*
   * `key === 'default'` significa que esta es la primera entrada del historial
   * dentro de la app: no hubo ninguna navegación previa que deshacer.
   */
  const hayAtras = location.key !== 'default';

  const volver = useCallback(() => {
    if (hayAtras) {
      navigate(-1);
      return;
    }
    navigate(casa, { replace: true });
  }, [hayAtras, navigate, casa]);

  return { volver, hayAtras, casa };
};
