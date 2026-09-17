import { Check } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useModo } from '../../hooks/useModo';

/*
 * Preferencias — cómo se ve la tienda para esta persona (área "Mi Cuenta").
 *
 * Por ahora: claro, oscuro o igual que el aparato. Se guarda en este
 * navegador y no en la cuenta —ver utils/modo.js— así que cambiarlo aquí se
 * ve al instante en la tienda y en Mi Cuenta, sin guardar ni recargar.
 *
 * Cada opción lleva un dibujito de la tienda en ese modo: "oscuro" dicho en
 * palabras no dice cuánto cambia; viéndolo se elige en un segundo.
 */

/*
 * Los colores de los dibujitos van FIJOS a propósito: la miniatura de "Claro"
 * tiene que verse clara aunque la página ya esté en oscuro, y al revés.
 */
const CLARO = { fondo: '#FFFFFF', barra: '#F5F5F5', tarjeta: '#EFEFEF', texto: '#1C1614', marca: '#003049' };
const OSCURO = { fondo: '#121417', barra: '#1F2328', tarjeta: '#23272C', texto: '#ECEEF0', marca: '#0F80BA' };

const MiniTienda = ({ p }) => (
  <svg viewBox="0 0 120 76" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <rect width="120" height="76" fill={p.fondo} />
    <rect width="120" height="14" fill={p.barra} />
    <rect x="8" y="5" width="22" height="4" rx="2" fill={p.texto} />
    <rect x="92" y="4" width="20" height="6" rx="3" fill={p.marca} />
    {[8, 45, 82].map((x) => (
      <g key={x}>
        <rect x={x} y="22" width="30" height="30" rx="5" fill={p.tarjeta} />
        <rect x={x} y="56" width="22" height="3.5" rx="1.75" fill={p.texto} opacity="0.85" />
        <rect x={x} y="63" width="14" height="3.5" rx="1.75" fill={p.marca} />
      </g>
    ))}
  </svg>
);

const OPCIONES = [
  { clave: 'claro', titulo: 'Claro', detalle: 'Fondo blanco, como siempre.', dibujo: <MiniTienda p={CLARO} /> },
  { clave: 'oscuro', titulo: 'Oscuro', detalle: 'Descansa la vista de noche.', dibujo: <MiniTienda p={OSCURO} /> },
  {
    clave: 'sistema',
    titulo: 'Automático',
    detalle: 'Igual que su teléfono o computadora.',
    // Mitad y mitad: se parte en diagonal para que se lea como "cambia solo".
    dibujo: (
      <div className="relative w-full h-full">
        <div className="absolute inset-0"><MiniTienda p={CLARO} /></div>
        <div className="absolute inset-0" style={{ clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)' }}>
          <MiniTienda p={OSCURO} />
        </div>
      </div>
    ),
  },
];

const Preferencias = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const { modo, setModo } = useModo();

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: c.textPrimary }}>Preferencias</h1>

      <section className="mt-8">
        <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>Apariencia</h2>
        <p className="text-sm mt-1" style={{ color: c.textSecondary }}>
          Cómo se ve la tienda en este dispositivo.
        </p>

        {/* En el teléfono va una debajo de otra con el dibujito chico a la izquierda:
            a lo ancho de la pantalla cada miniatura ocupaba media pantalla. */}
        <div role="radiogroup" aria-label="Apariencia" className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4 sm:gap-y-6 mt-5 max-w-2xl">
          {OPCIONES.map((op) => {
            const activa = modo === op.clave;
            return (
              <button
                key={op.clave}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => setModo(op.clave)}
                // Arriba y no centrado: si una descripción ocupa dos renglones, las
                // miniaturas siguen alineadas.
                className="group text-left self-start flex sm:block items-center gap-4"
              >
                <span
                  className="block relative w-28 sm:w-full flex-none overflow-hidden rounded-xl transition-shadow"
                  style={{
                    aspectRatio: '120 / 76',
                    // El anillo de la elegida; las demás, solo un filo que las separe del fondo.
                    boxShadow: activa
                      ? `0 0 0 2px ${c.primary}, 0 0 0 5px var(--marca-100)`
                      : `0 0 0 1px ${c.cardBorder}`,
                  }}
                >
                  {op.dibujo}
                  {activa && (
                    <span
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: c.primary, color: '#fff' }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="block min-w-0">
                  <span className="block text-sm sm:mt-2.5" style={{ color: activa ? c.primary : c.textPrimary, fontWeight: activa ? 700 : 600 }}>
                    {op.titulo}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: c.textSecondary }}>
                    {op.detalle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Preferencias;
