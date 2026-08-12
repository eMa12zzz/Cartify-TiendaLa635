import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * DIRECCIÓN ACTIVA — DireccionContext.js
 * ============================================================
 * A dónde le llevamos el pedido, elegida una vez y respetada en toda la tienda.
 * Puerto de `frontend/src/context/DireccionContext.jsx` + useDireccionActiva.
 *
 * La web guarda el índice de la dirección elegida en localStorage; aquí se
 * guarda la dirección completa ({ direccion, referencia, lat, lng, nombre }) en
 * AsyncStorage, con una llave por persona. Así quien casi siempre pide para la
 * casa no tiene que volver a marcarla cada vez, y sobrevive al cerrar la app.
 * ============================================================
 */
const DireccionContext = createContext(null);

const llave = (userId) => `kartify:direccion-activa:${userId || 'invitado'}`;

export const DireccionProvider = ({ children }) => {
  const { user } = useAuth();
  const [activa, setActiva] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar (o cambiar de usuario) se lee la dirección guardada.
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    AsyncStorage.getItem(llave(user?.id))
      .then((crudo) => {
        if (!vivo) return;
        try { setActiva(crudo ? JSON.parse(crudo) : null); } catch { setActiva(null); }
      })
      .catch(() => { if (vivo) setActiva(null); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [user?.id]);

  // Guardar/actualizar la dirección activa.
  const guardar = useCallback((dir) => {
    setActiva(dir);
    AsyncStorage.setItem(llave(user?.id), JSON.stringify(dir)).catch(() => {});
  }, [user?.id]);

  // Cómo se llama de reojo: el nombre que le puso la persona gana.
  const etiqueta = activa ? (activa.nombre || activa.direccion || 'Sin nombre') : '';

  return (
    <DireccionContext.Provider value={{ activa, etiqueta, cargando, guardar }}>
      {children}
    </DireccionContext.Provider>
  );
};

// Valores neutros por si se consulta fuera del árbol.
const SIN_PROVEEDOR = { activa: null, etiqueta: '', cargando: false, guardar: () => {} };

export const useDireccionCtx = () => useContext(DireccionContext) || SIN_PROVEEDOR;

export default DireccionContext;
