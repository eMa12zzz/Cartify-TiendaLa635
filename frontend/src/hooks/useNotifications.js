import { useState, useEffect } from 'react';
import { clientService } from '../api/clientService';
import { useAuth } from './useAuth';

/*
 * useNotifications — preferencias de notificación del cliente.
 * Carga las prefs y expone toggle(clave) que actualiza local + backend.
 * La lógica vive aquí; la página Notificaciones solo pinta los interruptores.
 */
const DEFAULTS = { promociones: true, nuevosProductos: true, pedidoCerca: false };

export const useNotifications = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.id) { setLoading(false); return; }
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
  }, [user?.id]);

  // Cambia un interruptor: actualiza la UI al instante y persiste en la base.
  const toggle = async (clave) => {
    if (!user?.id) return;
    const siguiente = { ...prefs, [clave]: !prefs[clave] };
    setPrefs(siguiente); // optimista: se ve el cambio de inmediato
    try {
      await clientService.updateNotifications(user.id, { [clave]: siguiente[clave] });
    } catch (error) {
      console.error('Error guardando notificación:', error);
      setPrefs(prefs); // si falla, revertimos
    }
  };

  return { prefs, loading, toggle };
};
