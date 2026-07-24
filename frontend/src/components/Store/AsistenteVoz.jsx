import { useEffect } from 'react';
import { Mic, X, ShoppingCart, Volume2 } from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';

/*
 * AsistenteVoz — la pantalla grande (kiosco) del asistente por voz.
 * Solo pinta: toda la lógica vive en useVoiceAssistant. Recibe el carrito y
 * productos por props para compartir el estado con la tienda.
 *
 * Diseño pensado para la tercera edad: fondo oscuro de alto contraste, letra
 * grande y un micrófono enorme fácil de presionar.
 */
const AsistenteVoz = ({ onClose, productos, agregarAlCarrito, eliminarDelCarrito, carrito, totalCarrito }) => {
  const { escuchando, transcripcion, respuesta, iniciar, detener, hablar, soportado } =
    useVoiceAssistant({ productos, agregarAlCarrito, eliminarDelCarrito, carrito, totalCarrito });

  // Saludo al abrir (el clic que abrió el overlay ya es un gesto del usuario,
  // así que el navegador permite la voz).
  useEffect(() => {
    hablar('Hola, soy tu asistente. Presiona el micrófono y dime qué quieres llevar. Por ejemplo: quiero una manzana.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(17,17,17,0.95)' }}>
      {/* Cerrar */}
      <button
        onClick={onClose}
        aria-label="Cerrar asistente"
        className="absolute top-5 right-5 w-12 h-12 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <X className="w-7 h-7" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">Asistente de voz</h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10">
          Presiona el micrófono y di qué quieres. Ejemplo: <span className="text-white font-semibold">"quiero una manzana"</span>
        </p>

        {/* Micrófono gigante */}
        <button
          onClick={escuchando ? detener : iniciar}
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-transform active:scale-95"
          style={{ backgroundColor: escuchando ? '#dc2626' : '#B47C4D' }}
          aria-label={escuchando ? 'Detener' : 'Hablar'}
        >
          {escuchando && (
            <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(220,38,38,0.4)' }} />
          )}
          <Mic className="w-20 h-20 md:w-24 md:h-24 text-white relative z-10" />
        </button>
        <p className="mt-5 text-base md:text-lg font-semibold" style={{ color: escuchando ? '#fca5a5' : '#e5e7eb' }}>
          {escuchando ? 'Escuchando…' : 'Toca para hablar'}
        </p>

        {/* Lo que se escuchó */}
        {transcripcion && (
          <p className="mt-6 text-lg text-gray-400">Escuché: <span className="text-white">"{transcripcion}"</span></p>
        )}

        {/* Lo que responde el asistente */}
        {respuesta && (
          <div className="mt-3 flex items-center gap-2 text-lg md:text-xl text-white">
            <Volume2 className="w-5 h-5 flex-none" style={{ color: '#C28C5D' }} />
            <span>{respuesta}</span>
          </div>
        )}

        {!soportado && (
          <p className="mt-6 text-sm text-red-300">
            Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
          </p>
        )}
      </div>

      {/* Carrito en la parte de abajo */}
      <div className="w-full max-w-3xl mx-auto px-6 pb-8">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white text-lg font-bold">
              <ShoppingCart className="w-5 h-5" /> Tu carrito ({items})
            </div>
            <div className="text-2xl font-extrabold text-white">${totalCarrito.toFixed(2)}</div>
          </div>
          {carrito.length === 0 ? (
            <p className="text-gray-400 text-base">Aún no has agregado nada. ¡Dime qué quieres!</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {carrito.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-white text-base">
                  <span>{item.emoji ? `${item.emoji} ` : ''}{item.cantidad}× {item.nombre}</span>
                  <span className="text-gray-300">${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-gray-400 text-sm mt-3">Di <span className="text-white font-semibold">"comprar"</span> cuando termines — un empleado te ayudará a pagar.</p>
        </div>
      </div>
    </div>
  );
};

export default AsistenteVoz;
