import { useState, useEffect } from 'react';
import { loyaltyService } from '../api/loyaltyService';
import { useAuth } from './useAuth';

/*
 * useLoyalty — datos de fidelidad del cliente logueado:
 *   - points:       saldo DISPONIBLE real (lotes no vencidos, del ledger)
 *   - nextExpiry:   próxima fecha en que vence un lote
 *   - expiringSoon: puntos que vencen dentro de 30 días
 *   - config:       tasa por dólar y meses de vencimiento (para textos)
 *
 * Toda la carga vive aquí; la página de Puntos solo pinta.
 */
export const useLoyalty = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ available: 0, nextExpiry: null, expiringSoon: 0 });
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        // En paralelo: el resumen de puntos del cliente y la config del programa.
        const [sum, cfg] = await Promise.all([
          user?.id
            ? loyaltyService.getSummary(user.id)
            : Promise.resolve({ available: 0, nextExpiry: null, expiringSoon: 0 }),
          loyaltyService.getConfig(),
        ]);
        setSummary(sum || { available: 0, nextExpiry: null, expiringSoon: 0 });
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
    points: summary.available,
    nextExpiry: summary.nextExpiry,
    expiringSoon: summary.expiringSoon,
    config,
    loading,
    pointsPerDollar: config?.pointsPerDollar ?? 1,
    expiryMonths: config?.expiryMonths ?? 3,
  };
};
