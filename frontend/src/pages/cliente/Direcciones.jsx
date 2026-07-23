import { useState } from 'react';
import { MapPin, Trash2, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAddresses } from '../../hooks/useAddresses';

/*
 * Direcciones — el cliente gestiona sus direcciones de entrega (área "Mi Cuenta").
 * La lógica (cargar/agregar/eliminar) vive en useAddresses; aquí solo pintamos.
 */
const Direcciones = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { addresses, loading, saving, agregar, eliminar } = useAddresses();
  const [nueva, setNueva] = useState('');

  const onAgregar = (e) => {
    e.preventDefault();
    agregar(nueva);
    setNueva('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Direcciones</h1>

      {/* Formulario para agregar una dirección */}
      <form onSubmit={onAgregar} className="flex gap-2 mb-6">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Ej. Calle Principal #123, San Salvador"
          className="flex-1 px-4 py-2.5 rounded-xl border outline-none transition-colors"
          style={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }}
        />
        <button
          type="submit"
          disabled={saving || !nueva.trim()}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-60"
          style={{ backgroundColor: c.primary, color: c.buttonText }}
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </form>

      {/* Lista de direcciones */}
      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus direcciones…</p>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>Sin direcciones guardadas</p>
          <p className="text-sm" style={{ color: c.textSecondary }}>Agrega una dirección para tus entregas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {addresses.map((dir, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
            >
              <MapPin className="w-5 h-5 flex-none" style={{ color: c.primary }} />
              <span className="flex-1 text-sm" style={{ color: c.textPrimary }}>{dir}</span>
              <button
                onClick={() => eliminar(i)}
                disabled={saving}
                aria-label="Eliminar dirección"
                className="p-1.5 rounded-lg transition-colors disabled:opacity-60"
                style={{ color: '#dc2626' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Direcciones;
