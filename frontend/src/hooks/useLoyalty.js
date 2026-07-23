import { useState, useEffect } from 'react';
import { clientService } from '../api/clientService';
import { loyaltyService } from '../api/loyaltyService';
import { useAuth } from './useAuth';

/*
 * useLoyalty — reúne los datos de fidelidad del cliente logueado:
 *   - sus puntos actuales (desde su documento en la base)
 *   - la config del programa (cuántos puntos por $1 y a cuántos meses vencen)
 *
 * Toda la carga vive aquí (regla del proyecto: la lógica va en hooks); la
 * página de Puntos solo consume estos valores y pinta.
 */
export const useLoyalty = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        // Pedimos en paralelo el cliente (para sus puntos) y la config.
        const [cliente, cfg] = await Promise.all([
          user?.id ? clientService.getClientById(user.id) : Promise.resolve(null),
          loyaltyService.getConfig(),
        ]);
        // Aceptamos el campo nuevo (loyaltyPoints) o el viejo (lolayitypoints).
        setPoints(Number(cliente?.loyaltyPoints ?? cliente?.lolayitypoints ?? 0));
        setConfig(cfg);
      } catch (error) {
        console.error('Error cargando loyalty:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id]);

  return {
    points,
    config,
    loading,
    // Valores con defaults por si la config aún no cargó.
    pointsPerDollar: config?.pointsPerDollar ?? 1,
    expiryMonths: config?.expiryMonths ?? 3,
  };
};
