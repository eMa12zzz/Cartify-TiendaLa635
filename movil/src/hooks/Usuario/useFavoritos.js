import { useState, useEffect, useCallback } from 'react';
import { clientService } from '../../api/Usuario/clientService';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * useFavoritos — el corazón de las tarjetas de producto.
 * Puerto de `frontend/src/hooks/useFavoritos.js`.
 *
 * Sin sesión de cliente no se guarda nada (marcar favoritos es de quien tiene
 * cuenta). El cambio se pinta ANTES de que responda el servidor y se revierte
 * si algo falla: un corazón que tarda medio segundo en encenderse se siente roto.
 *
 * Nota RN: la web navega al login cuando no hay sesión (useNavigate). Aquí, sin
 * router global, solo se avisa; la pantalla de Favoritos solo se abre desde
 * "Mi Cuenta", que ya requiere sesión.
 */
export const useFavoritos = () => {
  const { user, esCliente } = useAuth();
  const [ids, setIds] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!esCliente) { setCargando(false); return; }
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
  }, [user?.id, esCliente]);

  useEffect(() => { cargar(); }, [cargar]);

  const esFavorito = useCallback((productoId) => ids.includes(String(productoId)), [ids]);

  const alternar = async (productoId, nombre = 'El producto') => {
    if (!esCliente) {
      aviso('Inicie sesión para guardar sus favoritos');
      return;
    }

    const id = String(productoId);
    const estaba = ids.includes(id);

    // Optimista: el corazón responde al instante.
    setIds((prev) => (estaba ? prev.filter((x) => x !== id) : [...prev, id]));

    try {
      await clientService.toggleFavorite(user.id, id);
      aviso(estaba ? `${nombre} salió de favoritos` : `${nombre} guardado en favoritos`);
      if (productos.length || !estaba) cargar();
    } catch (error) {
      // Se deshace: mejor un corazón que vuelve atrás que una mentira guardada.
      setIds((prev) => (estaba ? [...prev, id] : prev.filter((x) => x !== id)));
      aviso('No se pudo guardar el favorito');
    }
  };

  return { ids, productos, cargando, esFavorito, alternar, recargar: cargar };
};

export default useFavoritos;
