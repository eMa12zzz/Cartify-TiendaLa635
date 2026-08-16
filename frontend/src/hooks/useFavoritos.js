import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clientService } from '../api/clientService';
import { useAuth } from './useAuth';

/*
 * useFavoritos — el corazón de las tarjetas de producto.
 *
 * Antes el corazón era un useState local: se pintaba de rojo y se olvidaba al
 * recargar. Ahora vive en la cuenta del cliente.
 *
 * Sin sesión no se guarda nada y se manda a iniciar sesión. La alternativa
 * era guardarlos en el navegador, pero eso los pierde al cambiar de teléfono
 * y obliga a resolver el choque cuando la persona entra y ya tenía otros en
 * su cuenta. Marcar favoritos es de quien tiene cuenta.
 *
 * El cambio se pinta ANTES de que responda el servidor y se revierte si algo
 * falla: un corazón que tarda medio segundo en encenderse se siente roto.
 */
export const useFavoritos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ids, setIds] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Solo los clientes tienen favoritos: pedirlos con un id de admin daría 404.
  const esCliente = user?.type === 'client';

  const cargar = useCallback(async () => {
    if (!user?.id || user?.type !== 'client') { setCargando(false); return; }
    try {
      setCargando(true);
      const lista = await clientService.getFavorites(user.id);
      const favoritos = Array.isArray(lista) ? lista : [];
      setProductos(favoritos);
      setIds(favoritos.map((p) => String(p._id)));
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setCargando(false);
    }
  }, [user?.id, user?.type]);

  useEffect(() => { cargar(); }, [cargar]);

  const esFavorito = useCallback((productoId) => ids.includes(String(productoId)), [ids]);

  const alternar = async (productoId, nombre = 'El producto') => {
    if (!esCliente) {
      toast('Inicie sesión para guardar sus favoritos');
      // Se le devuelve a la tienda después de entrar: estaba viendo un
      // producto, no buscando su cuenta.
      navigate('/iniciar-sesion?volver=/store');
      return;
    }

    const id = String(productoId);
    const estaba = ids.includes(id);

    // Optimista: el corazón responde al instante.
    setIds((prev) => (estaba ? prev.filter((x) => x !== id) : [...prev, id]));

    try {
      await clientService.toggleFavorite(user.id, id);
      toast.success(estaba ? `${nombre} salió de favoritos` : `${nombre} guardado en favoritos`);
      // La lista completa solo se recarga si estamos mostrándola.
      if (productos.length || !estaba) cargar();
    } catch (error) {
      // Se deshace: mejor un corazón que vuelve atrás que una mentira guardada.
      setIds((prev) => (estaba ? [...prev, id] : prev.filter((x) => x !== id)));
      toast.error('No se pudo guardar el favorito');
    }
  };

  return { ids, productos, cargando, esFavorito, alternar, recargar: cargar };
};
