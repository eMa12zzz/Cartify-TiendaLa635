import { useState, useEffect } from 'react';
import { Palette, ShoppingBag, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAjustesCtx } from '../../context/AjustesContext';
import { derivarMarca, hexAValido } from '../../utils/colorMarca';

/*
 * ============================================================
 * COLOR DE LA MARCA (Admin) — ColorMarca.jsx
 * ============================================================
 * Un solo color base para toda la tienda. De él sale la escala --marca-*
 * (ver utils/colorMarca.js) y se repinta la cara del cliente entera: botones,
 * pills, badges, iconos, acentos.
 *
 * El panel NO se repinta con esto: conserva sus paletas de accesibilidad. Y las
 * temporadas siguen mandando encima mientras duran; este es el color de todos
 * los días. Vacío = el café de fábrica que declara index.css.
 * ============================================================
 */

// El café de fábrica, para el previo cuando no hay color elegido todavía.
const CAFE = '#B46C30';

const ColorMarca = () => {
  const { ajustes, guardar, guardando } = useAjustesCtx();
  const [color, setColor] = useState('');

  useEffect(() => {
    setColor(ajustes.colorMarca || '');
  }, [ajustes.colorMarca]);

  const base = hexAValido(color) ? color : CAFE;
  const escala = derivarMarca(base) || {};
  const usandoCafe = !hexAValido(color);

  const onGuardar = async () => {
    // Vacío es válido: vuelve al café. Un hex a medio escribir, no.
    if (color && !hexAValido(color)) {
      toast.error('Escriba un color válido, como #B46C30, o déjelo vacío para el café.');
      return;
    }
    await guardar({ colorMarca: color });
  };

  const inputStyle = {
    backgroundColor: 'var(--theme-card-bg)',
    borderColor: 'var(--theme-card-border)',
    color: 'var(--theme-text-primary)',
  };

  return (
    <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: 'var(--theme-card-bg)', borderColor: 'var(--theme-card-border)' }}>
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
          <Palette className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          Color de la tienda
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
          El color base de la marca. De él sale toda la tienda: botones, pills, badges e iconos.
          El panel conserva su propia paleta, y las temporadas mandan encima mientras duran.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-5">
        {/*
          El swatch. El <input type="color"> nativo se dibuja con relleno y
          bordes propios del navegador y se veía feo; se pone TRANSPARENTE encima
          de un cuadro que pinta el color elegido, así se ve un swatch limpio y el
          clic sigue abriendo el selector del sistema.
        */}
        <label
          className="relative block w-14 h-14 rounded-xl border cursor-pointer flex-none overflow-hidden"
          style={{ borderColor: 'var(--theme-card-border)', backgroundColor: base }}
          title="Elegir el color de la marca"
        >
          <input
            type="color"
            value={base}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Elegir el color de la marca"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <div className="space-y-1">
          <label className="block text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Código del color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#B46C30"
            className="w-36 px-3 py-2 rounded-lg border outline-none text-sm font-mono"
            style={inputStyle}
          />
        </div>

        {/* La escala derivada, para que se vea que es una familia. */}
        <div className="space-y-1">
          <span className="block text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>Escala</span>
          <div className="flex gap-1.5">
            {['--marca-700', '--marca-600', '--marca-400', '--marca-100', '--marca-50'].map((k) => (
              <span
                key={k}
                title={escala[k]}
                className="w-7 h-7 rounded-lg border"
                style={{ backgroundColor: escala[k], borderColor: 'rgba(0,0,0,0.08)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Previo: cómo se ve un pedacito de tienda con ese color. */}
      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: 'var(--theme-card-border)', background: '#fff' }}>
        <span className="block text-xs font-semibold mb-3" style={{ color: '#8A8177' }}>Vista previa</span>
        <div className="flex items-center gap-3 flex-wrap">
          {/* pill activa */}
          <span className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: escala['--marca-100'], color: escala['--marca-600'], border: `2px solid ${escala['--marca-600']}` }}>
            Panadería
          </span>
          {/* botón de acento de marca */}
          <button type="button" className="px-4 py-2 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: escala['--marca-600'] }}>
            Asistente
          </button>
          {/* botón "+" negro (no cambia: es la acción, no la marca) */}
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: '#1C1614' }}>
            +
          </span>
          {/* badge de promo */}
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: escala['--marca-600'] }}>
            -20%
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: escala['--acento'] }}>
            <ShoppingBag className="w-4 h-4" /> Editar
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="px-8 py-2.5 rounded-full font-bold shadow-sm transition-colors disabled:opacity-60"
          style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-button-text)' }}
        >
          {guardando ? 'Guardando…' : 'Guardar color'}
        </button>
        {!usandoCafe && (
          <button
            type="button"
            onClick={() => setColor('')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <RotateCcw className="w-4 h-4" /> Volver al café de siempre
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorMarca;
