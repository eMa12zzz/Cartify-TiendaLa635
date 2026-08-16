import { useState } from 'react';
import { MapPin, Trash2, Plus, Signpost } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useAddresses } from '../../hooks/useAddresses';
import MapaDireccion from '../../components/Store/MapaDireccion';

/*
 * Direcciones — el cliente gestiona sus direcciones de entrega (área "Mi Cuenta").
 * La lógica (cargar/eliminar) vive en useAddresses; aquí solo pintamos.
 *
 * Agregar es SIEMPRE con el mapa: escribir la dirección a ciegas en una caja
 * de texto daba direcciones que el repartidor después no encontraba, que se
 * cobraban a tarifa plana en vez de por distancia y que el cliente no podía
 * seguir en el mapa. Ver MapaDireccion.jsx.
 *
 * El mapa se abre AQUÍ MISMO, en un panel. Antes mandaba a /bienvenida —otra
 * pantalla, con su viaje de ida y vuelta— para hacer algo que cabe en esta.
 */
const Direcciones = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { addresses, loading, saving, agregar, eliminar } = useAddresses();
  const [agregando, setAgregando] = useState(false);

  const abrirMapa = () => setAgregando(true);

  const guardar = (dir) => {
    agregar(dir);
    setAgregando(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: c.textPrimary }}>Direcciones</h1>
        <button
          onClick={abrirMapa}
          className="press flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm"
          style={{ backgroundColor: c.primary, color: c.buttonText }}
        >
          <Plus className="w-4 h-4" /> Agregar en el mapa
        </button>
      </div>

      {/*
        El mapa, incrustado. Va arriba de la lista porque cuando está abierto
        es lo único que importa en la pantalla.
      */}
      {agregando && (
        <div
          className="mb-6 p-4 rounded-2xl"
          style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
        >
          <MapaDireccion
            onGuardar={guardar}
            onCancelar={() => setAgregando(false)}
            guardando={saving}
            alto={300}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando tus direcciones…</p>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>Sin direcciones guardadas</p>
          <p className="text-sm mb-5" style={{ color: c.textSecondary }}>
            Marque en el mapa dónde le dejamos sus pedidos.
          </p>
          <button
            onClick={abrirMapa}
            className="press px-5 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            Abrir el mapa
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {addresses.map((dir, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
            >
              <MapPin className="w-5 h-5 flex-none mt-0.5" style={{ color: c.primary }} />
              <div className="flex-1 min-w-0">
                {dir.nombre && (
                  <div className="text-sm font-bold mb-0.5" style={{ color: c.textPrimary }}>{dir.nombre}</div>
                )}
                <div className="text-sm" style={{ color: dir.nombre ? c.textSecondary : c.textPrimary }}>
                  {dir.direccion}
                </div>
                {dir.referencia && (
                  <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: c.textMuted }}>
                    <Signpost className="w-3.5 h-3.5 flex-none" />
                    {dir.referencia}
                  </div>
                )}
              </div>
              <button
                onClick={() => eliminar(i)}
                disabled={saving}
                aria-label={`Eliminar ${dir.nombre || 'dirección'}`}
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
