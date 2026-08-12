import { useState, useEffect } from 'react';
import { clientService } from '../../api/Usuario/clientService';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * usePaymentMethods — gestiona los métodos de pago guardados del cliente.
 * Puerto de `frontend/src/hooks/usePaymentMethods.js`. Guardamos SOLO datos no
 * sensibles (tipo, alias, últimos 4). El cobro real pasa por la pasarela.
 */
export const usePaymentMethods = () => {
  const { user, esCliente } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!esCliente) { setLoading(false); return; }
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
  }, [user?.id, esCliente]);

  const guardar = async (nuevos) => {
    if (!esCliente) return;
    try {
      setSaving(true);
      await clientService.updatePaymentMethods(user.id, nuevos);
      setMethods(nuevos);
      aviso('Métodos de pago actualizados');
    } catch (error) {
      console.error('Error guardando métodos de pago:', error);
      aviso('No se pudieron guardar los métodos');
    } finally {
      setSaving(false);
    }
  };

  const agregar = (metodo) => guardar([...methods, metodo]);
  const eliminar = (indice) => guardar(methods.filter((_, i) => i !== indice));

  return { methods, loading, saving, agregar, eliminar };
};

export default usePaymentMethods;
