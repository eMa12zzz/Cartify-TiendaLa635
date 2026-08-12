import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../../api/Usuario/clientService';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * useClientProfile — carga y guarda el perfil del cliente logueado.
 * Puerto de `frontend/src/hooks/useClientProfile.js`. Toda la lógica (traer +
 * actualizar + subir foto) vive aquí; la pantalla DetallesCuenta solo pinta.
 */
export const useClientProfile = () => {
  const { user, esCliente, actualizarUsuario } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const cargar = useCallback(async () => {
    // Solo los clientes tienen perfil de cliente: con sesión de personal esto
    // daría 404. Ver la guarda `esCliente` en el AuthContext.
    if (!esCliente) { setLoading(false); return; }
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
      aviso('Datos actualizados');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      aviso('No se pudieron guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  /*
   * Subir/reemplazar la foto de perfil. En React Native la imagen viene de un
   * selector (expo-image-picker) como { uri, name, type }, y se arma un
   * FormData igual que en la web. El endpoint multipart exige también los datos
   * básicos ya guardados (no los del formulario a medio escribir).
   */
  const subirFoto = async (archivo) => {
    if (!esCliente || !profile || !archivo?.uri) return;

    const fd = new FormData();
    fd.append('fullName', profile.fullName || '');
    fd.append('phoneNumber', profile.phoneNumber || '');
    fd.append('email', profile.email || '');
    fd.append('userName', profile.userName || '');
    // RN quiere el archivo como objeto { uri, name, type }.
    fd.append('image', {
      uri: archivo.uri,
      name: archivo.name || 'foto.jpg',
      type: archivo.type || 'image/jpeg',
    });

    try {
      setSubiendoFoto(true);
      const res = await clientService.actualizarConFoto(user.id, fd);
      if (res.client) setProfile(res.client);
      // El avatar del encabezado lee de la sesión: se refresca aquí.
      actualizarUsuario({ image: res.client?.image });
      aviso('Foto de perfil actualizada');
    } catch (error) {
      aviso(error?.message || 'No se pudo subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  return { profile, loading, saving, subiendoFoto, guardar, subirFoto };
};

export default useClientProfile;
