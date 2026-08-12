import { useState, useEffect } from 'react';
import { loyaltyService } from '../../api/Usuario/loyaltyService';
import { useAuth } from '../useAuth';

/*
 * useLoyalty — datos de fidelidad del cliente logueado.
 * Puerto de `frontend/src/hooks/useLoyalty.js`.
 *   - points:       saldo DISPONIBLE real (lotes no vencidos)
 *   - nextExpiry:   próxima fecha en que vence un lote
 *   - expiringSoon: puntos que vencen dentro de 30 días
 *   - config:       tasa por dólar y meses de vencimiento (para los textos)
 */
export const useLoyalty = () => {
  const { user, esCliente } = useAuth();
  const [summary, setSummary] = useState({ available: 0, nextExpiry: null, expiringSoon: 0 });
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        // En paralelo: el resumen del cliente y la config del programa (que la
        // puede leer cualquiera). Solo el resumen va detrás de `esCliente`.
        const [sum, cfg] = await Promise.all([
          esCliente
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
  }, [user?.id, esCliente]);

  return {
    points: summary.available,
    nextExpiry: summary.nextExpiry,
    expiringSoon: summary.expiringSoon,
    config,
    loading,
    pointsPerDollar: config?.pointsPerDollar ?? 1,
    expiryMonths: config?.expiryMonths ?? 3,
    // Canje: cuántos puntos valen $1 y el mínimo para poder usarlos.
    redeemRate: config?.pointsPerDollarRedeem ?? 100,
    minRedeem: config?.minRedeemPoints ?? 100,
    // Cuánto dinero valen los puntos disponibles ahora mismo.
    valorEnDinero: Number((summary.available / (config?.pointsPerDollarRedeem ?? 100)).toFixed(2)),
  };
};

export default useLoyalty;
