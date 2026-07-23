import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clientService } from '../api/clientService';
import { useAuth } from './useAuth';

/*
 * usePaymentMethods — gestiona los métodos de pago guardados del cliente.
 * Guardamos SOLO datos no sensibles (tipo, alias, últimos 4). La lógica vive
 * aquí; la página MetodoPago solo pinta la lista y el formulario.
 */
export const usePaymentMethods = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setLoading(true);
        const cliente = await clientService.getClientById(user.id);
        setMethods(Array.isArray(cliente?.paymentMethods) ? cliente.paymentMethods : []);
      } catch (error) {
        console.error('Error cargando métodos de pago:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id]);

  const guardar = async (nuevos) => {
    if (!user?.id) return;
    try {
      setSaving(true);
      await clientService.updatePaymentMethods(user.id, nuevos);
      setMethods(nuevos);
      toast.success('Métodos de pago actualizados');
    } catch (error) {
      console.error('Error guardando métodos de pago:', error);
    } finally {
      setSaving(false);
    }
  };

  const agregar = (metodo) => guardar([...methods, metodo]);
  const eliminar = (indice) => guardar(methods.filter((_, i) => i !== indice));

  return { methods, loading, saving, agregar, eliminar };
};
