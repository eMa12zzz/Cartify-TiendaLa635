import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clientService } from '../api/clientService';
import { useAuth } from './useAuth';

/*
 * useAddresses — gestiona las direcciones de entrega del cliente logueado.
 * Carga la lista, y expone agregar/eliminar (que guardan la lista completa en
 * la base). La lógica vive aquí; la página Direcciones solo pinta.
 */
export const useAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setLoading(true);
        const cliente = await clientService.getClientById(user.id);
        setAddresses(Array.isArray(cliente?.clientAddress) ? cliente.clientAddress : []);
      } catch (error) {
        console.error('Error cargando direcciones:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id]);

  // Guarda la lista completa en la base y actualiza el estado local.
  const guardar = async (nuevas) => {
    if (!user?.id) return;
    try {
      setSaving(true);
      await clientService.updateAddresses(user.id, nuevas);
      setAddresses(nuevas);
      toast.success('Direcciones actualizadas');
    } catch (error) {
      console.error('Error guardando direcciones:', error);
    } finally {
      setSaving(false);
    }
  };

  const agregar = (direccion) => {
    const limpia = direccion.trim();
    if (!limpia) return;
    guardar([...addresses, limpia]);
  };

  const eliminar = (indice) => {
    guardar(addresses.filter((_, i) => i !== indice));
  };

  return { addresses, loading, saving, agregar, eliminar };
};
