import { Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useLoyalty } from '../../hooks/useLoyalty';

/*
 * PuntosFidelidad — tarjeta de fidelidad del cliente (área "Mi Cuenta").
 *
 * Migrada de mockup estático a datos REALES: el nombre del cliente, sus puntos
 * desde la base, y la tasa/vencimiento desde la config editable (loyaltyConfig).
 * La lógica de datos vive en useLoyalty; aquí solo pintamos.
 */
const PuntosFidelidad = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { user } = useAuth();
  const { points, pointsPerDollar, expiryMonths, loading } = useLoyalty();

  // Fecha de vencimiento estimada (Fase 1): hoy + los meses de la config.
  // En la Fase 2 el vencimiento será por lote de puntos (fecha real por compra).
  const vence = new Date();
  vence.setMonth(vence.getMonth() + expiryMonths);
  const venceStr = vence.toLocaleDateString('es-SV', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const plural = pointsPerDollar === 1 ? '' : 's';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>
        Puntos de fidelidad
      </h1>

      {/* ── Tarjeta de fidelidad ── */}
      <div
        className="rounded-2xl p-6 mb-8 relative overflow-hidden text-white"
        style={{ background: `linear-gradient(130deg, ${c.primary} 0%, ${c.accent} 55%, ${c.primaryHover} 100%)` }}
      >
        {/* Etiqueta tipo "tag" de la tienda */}
        <div
          className="absolute right-7 top-1/2 -translate-y-1/2 w-24 h-24 rounded-xl flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <div className="font-extrabold text-xs text-center leading-tight">Tienda<br />la 635</div>
        </div>

        <div className="relative z-10">
          <div className="text-xl font-bold">{user?.fullName || 'Cliente'}</div>
          <div className="text-sm opacity-80 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4" /> {loading ? '…' : points} puntos
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <div className="text-sm opacity-90">
            Ganas {pointsPerDollar} punto{plural} por cada $1 que gastas.
          </div>
          <div className="text-sm opacity-80 mt-1">
            Vencen: <strong>{venceStr}</strong>
          </div>
        </div>
      </div>

      {/* ── Preguntas frecuentes (reflejan la config real) ── */}
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-sm font-bold mb-1" style={{ color: c.textPrimary }}>
            ¿Cómo consigo puntos?
          </div>
          <div className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>
            Por cada $1 que gastas en la tienda ganas {pointsPerDollar} punto{plural}. Se acumulan
            automáticamente con cada compra que realizas.
          </div>
        </div>
        <div>
          <div className="text-sm font-bold mb-1" style={{ color: c.textPrimary }}>
            ¿Cuándo vencen?
          </div>
          <div className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>
            Tus puntos vencen a los {expiryMonths} meses de haberlos ganado, así que aprovéchalos
            antes de esa fecha.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuntosFidelidad;
