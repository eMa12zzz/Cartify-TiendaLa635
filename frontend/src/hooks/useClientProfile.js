import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { clientService } from '../api/clientService';
import { useAuth } from './useAuth';

/*
 * useClientProfile — carga y guarda el perfil del cliente logueado.
 * Toda la lógica (fetch + update) vive aquí; la página DetallesCuenta solo
 * pinta el formulario y llama a guardar().
 */
export const useClientProfile = () => {
  const { user, esCliente } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    // Solo los clientes tienen perfil de cliente: con sesión de personal esto
    // daría 404 y un aviso rojo. Ver el porqué completo en useAuth.
    if (!esCliente) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await clientService.getClientById(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, esCliente]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (campos) => {
    if (!esCliente) return;
    try {
      setSaving(true);
      const res = await clientService.updateProfile(user.id, campos);
      setProfile(res.client || { ...profile, ...campos });
      toast.success('Datos actualizados');
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, guardar };
};
