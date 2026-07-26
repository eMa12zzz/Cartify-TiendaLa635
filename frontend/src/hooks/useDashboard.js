import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../api/dashboardService';

/*
 * useDashboard — carga el resumen del admin desde la base.
 * Cambiar el periodo (semana/mes/año) vuelve a pedir los datos, porque la
 * gráfica de ventas vs compras se agrupa distinto en cada caso.
 */
export const useDashboard = () => {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState('mes');
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSummary(periodo);
      setData(res);
    } catch (error) {
      console.error('Error cargando el dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { data, loading, periodo, setPeriodo, recargar: cargar };
};
