import { useNavigate } from 'react-router-dom';
import { Heart, Package, Trash2 } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';
import { useFavoritosCtx } from '../../context/FavoritosContext';

/*
 * Favoritos — los productos que el cliente marcó con el corazón.
 *
 * Antes el corazón no guardaba nada: se pintaba de rojo y se olvidaba al
 * recargar la página. Ahora vive en su cuenta y esta es la pantalla donde los
 * vuelve a encontrar.
 */

const dinero = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const Favoritos = () => {
  const { palette } = useTheme();
  const c = palette.colors;
  const navigate = useNavigate();
  const { productos, cargando, alternar } = useFavoritosCtx();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Mis favoritos</h1>

      {cargando ? (
        <p className="text-sm" style={{ color: c.textSecondary }}>Cargando sus favoritos…</p>
      ) : productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-10 h-10 mb-3" style={{ color: c.textMuted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: c.textPrimary }}>
            Todavía no tiene favoritos
          </p>
          <p className="text-sm mb-5" style={{ color: c.textSecondary }}>
            Toque el corazón de un producto en la tienda y aparecerá aquí.
          </p>
          <button
            onClick={() => navigate('/store')}
            className="press px-5 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: c.primary, color: c.buttonText }}
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => {
            const imagen = Array.isArray(p.image) ? p.image[0] : p.image;
            return (
              <div
                key={p._id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
              >
                {/* Mismo encuadre que la tienda: la foto entera, sin recortes */}
                <div
                  className="h-40 m-3 mb-0 rounded-xl flex items-center justify-center p-3"
                  style={{ backgroundColor: c.primaryLight }}
                >
                  {imagen ? (
                    <img
                      src={imagen}
                      alt={p.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Package className="w-9 h-9" style={{ color: c.textMuted }} />
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.textMuted }}>
                    {p.brandId?.name || ''}
                  </div>
                  <div className="text-sm font-bold mb-1" style={{ color: c.textPrimary }}>{p.name}</div>
                  <div className="text-lg font-extrabold mb-3" style={{ color: c.textPrimary }}>
                    {dinero(p.salePrice)}
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => navigate('/store')}
                      className="press flex-1 py-2 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: c.primary, color: c.buttonText }}
                    >
                      Ver en la tienda
                    </button>
                    <button
                      onClick={() => alternar(p._id, p.name)}
                      title="Quitar de favoritos"
                      aria-label={`Quitar ${p.name} de favoritos`}
                      className="press p-2 rounded-full"
                      style={{ border: `1px solid ${c.cardBorder}`, color: '#ef4444' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favoritos;
