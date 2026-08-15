import { useState } from 'react';
import { Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '../../api/reviewService';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * VALORAR EL PEDIDO — ValoracionPedido.jsx
 * ============================================================
 * Cuando un pedido ya está ENTREGADO, el cliente lo califica EN GENERAL: unas
 * estrellas y un comentario para todo el pedido, no producto por producto.
 *
 * Esa calificación se guarda como reseña de los productos que llevó (reusa
 * reviewService), así no queda flotando sin destino y de paso alimenta la nota
 * de cada producto. Un pedido se califica una sola vez.
 * ============================================================
 */
const ESTRELLAS = [1, 2, 3, 4, 5];

// Una clave por pedido: omitir uno no debe ocultar el aviso de los demás.
const claveOmitida = (pedidoId) => `valoracion-omitida-${pedidoId}`;

const ValoracionPedido = ({ items = [], pedidoId = '' }) => {
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Se recuerda entre visitas: si ya dijo "ahora no", no se le vuelve a
  // preguntar cada vez que entra a ver su pedido entregado.
  const [omitido, setOmitido] = useState(
    () => !!pedidoId && localStorage.getItem(claveOmitida(pedidoId)) === '1'
  );

  const omitir = () => {
    if (pedidoId) localStorage.setItem(claveOmitida(pedidoId), '1');
    setOmitido(true);
  };

  // Los productos únicos del pedido (uno puede venir repetido).
  const vistos = new Set();
  const productosIds = items
    .map((it) => String(it.productId?._id || it.productId || ''))
    .filter((id) => {
      if (!id || vistos.has(id)) return false;
      vistos.add(id);
      return true;
    });

  if (!user?.id || productosIds.length === 0 || omitido) return null;

  const enviar = async () => {
    if (rating < 1) {
      toast.error('Elija cuántas estrellas antes de enviar');
      return;
    }
    setGuardando(true);
    try {
      // La misma calificación del pedido se guarda para cada producto que llevó.
      await Promise.all(
        productosIds.map((productId) =>
          reviewService.guardar({ productId, clientId: user.id, rating, comment: comentario.trim() })
        )
      );
      setEnviado(true);
      toast.success('¡Gracias por calificar su pedido!');
    } catch {
      toast.error('No se pudo guardar su valoración. Intente de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const marcadas = hover || rating;

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{ backgroundColor: 'var(--papel)', borderColor: 'var(--linea)' }}
    >
      <h2 className="text-lg font-bold" style={{ color: 'var(--tinta)' }}>¿Qué le pareció su pedido?</h2>

      {enviado ? (
        <div className="flex items-center gap-2 mt-3 text-sm font-semibold" style={{ color: 'var(--exito)' }}>
          <Check className="w-5 h-5" /> ¡Gracias por calificar su pedido!
        </div>
      ) : (
        <>
          <p className="text-sm mt-0.5 mb-4" style={{ color: 'var(--tinta-suave)' }}>
            Su pedido ya llegó. Déjenos saber qué tal estuvo, para que otros vecinos se animen.
          </p>

          {/* Una sola fila de estrellas para todo el pedido */}
          <div className="flex items-center gap-1.5 mb-4" onMouseLeave={() => setHover(0)}>
            {ESTRELLAS.map((n) => {
              const activa = marcadas >= n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={guardando}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                  className="press disabled:opacity-60"
                >
                  <Star
                    className="w-9 h-9 transition-colors"
                    style={{ color: activa ? '#F5A623' : 'var(--tinta-tenue)' }}
                    fill={activa ? '#F5A623' : 'none'}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            rows={2}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Algo que quiera contar? (opcional)"
            className="w-full px-3 py-2.5 rounded-xl border outline-none resize-none text-sm mb-3"
            style={{ backgroundColor: 'var(--papel)', borderColor: 'var(--linea)', color: 'var(--tinta)' }}
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={enviar}
              disabled={guardando}
              className="press px-6 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--marca-600)' }}
            >
              {guardando ? 'Enviando…' : 'Enviar valoración'}
            </button>
            <button
              type="button"
              onClick={omitir}
              disabled={guardando}
              className="press text-sm font-semibold disabled:opacity-60"
              style={{ color: 'var(--tinta-suave)' }}
            >
              Ahora no
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ValoracionPedido;
