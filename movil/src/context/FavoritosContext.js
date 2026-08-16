/*
 * ============================================================
 * FAVORITOS — el corazón de las tarjetas
 * ============================================================
 * Copia del contrato de `useFavoritos` en la web: `esFavorito(id)` y
 * `alternar(id, nombre)`.
 *
 * ── Vive en la cuenta, no en el teléfono ──
 *
 * Y eso es a propósito, aunque ahora que hay expo-secure-store guardarlos aquí
 * sería fácil. Guardados en el teléfono se pierden al cambiar de aparato, y
 * obligan a resolver el choque el día que la persona entra y ya tenía otros en
 * su cuenta. Marcar favoritos es de quien tiene cuenta. (El carrito sí se
 * guarda local, y por la razón contraria: se llena ANTES de tener cuenta.)
 *
 * ── El corazón se pinta antes de que conteste el servidor ──
 *
 * Un corazón que tarda medio segundo en encenderse se siente roto, y en un
 * teléfono con datos móviles ese medio segundo son dos. Se pinta al instante y
 * se revierte si la petición falla: mejor un corazón que vuelve atrás con su
 * aviso que una mentira guardada en pantalla.
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getFavoritos, alternarFavorito } from '../api/favoritosApi';
import { useAuth } from '../hooks/useAuth';
import { useAviso } from './AvisoContext';

const FavoritosContext = createContext(null);

export const FavoritosProvider = ({ children, alPedirSesion }) => {
  const { user } = useAuth();
  const { avisar } = useAviso();
  const [ids, setIds] = useState([]);

  // Solo los clientes tienen favoritos: pedirlos con un id de admin daría 404.
  const esCliente = user?.type === 'client' && !!user?.id;

  const cargar = useCallback(async () => {
    if (!esCliente) {
      // Al cerrar sesión se vacía: si no, los corazones del anterior se
      // quedarían encendidos para el siguiente que entre.
      setIds([]);
      return;
    }
    try {
      const lista = await getFavoritos(user.id);
      setIds((Array.isArray(lista) ? lista : []).map((p) => String(p._id)));
    } catch {
      /*
       * Que falle la lista de favoritos no puede tumbar la tienda. Los
       * corazones salen apagados, que es un estado honesto: no sabemos cuáles
       * marcó, así que no encendemos ninguno.
       */
    }
  }, [esCliente, user?.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const esFavorito = useCallback((productoId) => ids.includes(String(productoId)), [ids]);

  const alternar = useCallback(
    async (productoId, nombre = 'El producto') => {
      if (!esCliente) {
        avisar('Inicie sesión para guardar sus favoritos');
        // Se le lleva a entrar, pero no se le arrastra: estaba viendo un
        // producto, no buscando su cuenta.
        alPedirSesion?.();
        return;
      }

      const id = String(productoId);
      const estaba = ids.includes(id);

      // Optimista: el corazón responde al instante.
      setIds((prev) => (estaba ? prev.filter((x) => x !== id) : [...prev, id]));

      try {
        await alternarFavorito(user.id, id);
        avisar(estaba ? `${nombre} salió de favoritos` : `${nombre} guardado en favoritos`);
      } catch {
        // Se deshace.
        setIds((prev) => (estaba ? [...prev, id] : prev.filter((x) => x !== id)));
        avisar('No se pudo guardar el favorito', 'error');
      }
    },
    [esCliente, ids, user?.id, avisar, alPedirSesion]
  );

  const valor = useMemo(
    () => ({ ids, esFavorito, alternar, recargar: cargar }),
    [ids, esFavorito, alternar, cargar]
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
};

export const useFavoritos = () => {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>');
  return ctx;
};
