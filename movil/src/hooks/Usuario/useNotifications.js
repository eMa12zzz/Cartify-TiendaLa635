import { useState, useEffect } from 'react';
import { clientService } from '../../api/Usuario/clientService';
import { useAuth } from '../useAuth';

/*
 * useNotifications — preferencias de notificación del cliente.
 * Puerto de `frontend/src/hooks/useNotifications.js`. Carga las prefs y expone
 * toggle(clave), que cambia la UI al instante y persiste en la base.
 */
const DEFAULTS = { promociones: true, nuevosProductos: true, pedidoCerca: false };

export const useNotifications = () => {
  const { user, esCliente } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!esCliente) { setLoading(false); return; }
      try {
        setLoading(true);
        const cliente = await clientService.getClientById(user.id);
        setPrefs({ ...DEFAULTS, ...(cliente?.notificationPrefs || {}) });
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id, esCliente]);

  // Cambia un interruptor: optimista (se ve al instante) y luego persiste.
  const toggle = async (clave) => {
    if (!esCliente) return;
    const siguiente = { ...prefs, [clave]: !prefs[clave] };
    setPrefs(siguiente);
    try {
      await clientService.updateNotifications(user.id, { [clave]: siguiente[clave] });
    } catch (error) {
      console.error('Error guardando notificación:', error);
      setPrefs(prefs); // si falla, revertimos
    }
  };

  return { prefs, loading, toggle };
};

export default useNotifications;
