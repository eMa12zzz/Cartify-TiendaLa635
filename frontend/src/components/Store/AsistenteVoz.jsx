import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, X, ShoppingCart, Volume2, VolumeX, Gauge, Minimize2, QrCode, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useKiosco } from '../../hooks/useKiosco';
import { orderService } from '../../api/orderService';

/*
 * AsistenteVoz — pantalla grande (kiosco) del asistente por voz.
 * Solo pinta; la lógica vive en useVoiceAssistant. Animaciones con la vara de
 * Emil (ease-out fuerte, <300ms, respeta prefers-reduced-motion).
 */
const EASE_OUT = [0.23, 1, 0.32, 1];

const AsistenteVoz = ({
  onClose, productos, carrito, totalCarrito,
  agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
  categorias, irAProducto, irACategoria, irARuta,
}) => {
  const reduce = useReducedMotion();
  const [minimizado, setMinimizado] = useState(false); // asistente en segundo plano

  /*
   * Hablar por referencia: cerrarCompra necesita hablar, pero se define ANTES
   * de que exista el hook, porque el hook la recibe como parámetro. El ref
   * rompe ese huevo y gallina sin tener que partir el componente en dos.
   *
   * Y va declarado ACÁ ARRIBA, antes del hook, no después. Estaba declarado
   * más abajo y la línea que lo llena (`hablarRef.current = hablar`) quedaba
   * por encima de su propio `const`: al abrir el asistente reventaba con
   * "Cannot access 'hablarRef' before initialization" y no se abría nunca.
   * Un `const` no se puede tocar antes de su declaración aunque estén en la
   * misma función — eso es lo que atrapa a cualquiera aquí.
   */
  const hablarRef = useRef(null);

  const {
    activo, escuchando, muteado, transcripcion, historial, velLabel, pensando, hablando,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, soportado, interrumpir,
    voces, vozActual, cambiarVoz,
  } = useVoiceAssistant({
    productos, carrito, totalCarrito,
    agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    categorias,
    /*
     * Antes de llevar a la persona a algún lado, el asistente se hace a un
     * lado: mostrar un producto y dejar la pantalla negra encima sería
     * enseñarle algo tapado. Sigue vivo y escuchando en segundo plano, que
     * es justo la gracia — se sigue navegando con la voz.
     */
    irAProducto: (p) => { setMinimizado(true); irAProducto?.(p); },
    irACategoria: (c) => { setMinimizado(true); irACategoria?.(c); },
    irARuta: (r) => { setMinimizado(true); irARuta?.(r); },
    alConfirmarCompra: () => cerrarCompra(),
  });

  hablarRef.current = hablar;

  // La cuenta del cliente, si escaneó el QR con su teléfono.
  const kiosco = useKiosco();

  /*
   * Cerrar la compra del kiosco.
   *
   * Con cuenta vinculada, el pedido se crea A SU NOMBRE: es lo que hace que
   * los puntos le caigan solos, porque el backend los calcula al crear el
   * pedido. El pago sigue siendo en caja, con efectivo o tarjeta — el kiosco
   * no cobra, solo deja el pedido listo.
   *
   * Y pase lo que pase, el código se quema. Si no, el siguiente que se para
   * en el kiosco encontraría la sesión abierta y le seguiría cargando
   * compras y puntos a la cuenta de quien ya se fue.
   */
  const cerrarCompra = async () => {
    const cliente = kiosco.cliente;

    if (!cliente) {
      hablarRef.current?.('¡Listo! Lleve su carrito a caja, un empleado le ayudará a pagar. ¡Gracias!');
      return;
    }

    try {
      await orderService.createOrder({
        clientId: cliente.id,
        items: carrito.map((i) => ({
          productId: i.id,
          name: i.nombre,
          price: i.precio,
          amount: i.cantidad,
        })),
        total: totalCarrito,
        paymentMethod: 'efectivo', // se define en caja; el kiosco no cobra
        paymentStatus: 'pendiente',
        deliveryType: 'retiro',
        channel: 'kiosco',
      });

      hablarRef.current?.(
        `¡Listo, ${cliente.nombre}! Su pedido quedó a su nombre y sus puntos ya están sumados. Pase a caja a pagar.`
      );
      limpiarCarrito?.();
    } catch {
      // El pedido no se pudo crear: se lo decimos, no se lo inventamos.
      hablarRef.current?.('No pude registrar su pedido. Pase a caja y un empleado le ayuda.');
    } finally {
      // El código muere aquí, con pedido o sin él.
      kiosco.cerrar();
    }
  };

  const chatRef = useRef(null);
  const saludadoRef = useRef(false);

  useEffect(() => {
    if (saludadoRef.current) return; // evita el saludo doble en desarrollo (StrictMode)
    saludadoRef.current = true;
    toast.dismiss();
    hablar('Hola, soy tu asistente. Toca el micrófono y dime qué quieres llevar. Por ejemplo: quiero una manzana.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll del chat al último mensaje.
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [historial]);

  const items = carrito.reduce((a, i) => a + i.cantidad, 0);
  const pulsa = escuchando && !reduce;

  /*
   * "Pensando" va primero: cuando la IA está descifrando la frase pasa cerca
   * de un segundo en silencio, y sin avisar eso se lee como que el asistente
   * se colgó. Decirlo convierte la espera en algo que está pasando.
   */
  const estadoTexto = pensando
    ? 'Pensando…'
    : hablando ? 'Toca para interrumpir'
    : !activo ? 'Toca para empezar'
    : escuchando ? 'Escuchando…' : 'Un momento…';
  const estadoColor = pensando
    ? '#93c5fd'
    : hablando ? '#a7f3d0'
    : !activo ? '#e5e7eb'
    : escuchando ? '#fca5a5' : '#fcd34d';
  const micColor = escuchando ? '#dc2626' : activo ? '#d97706' : '#B47C4D';

  const pill = { backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)' };

  // ── Modo SEGUNDO PLANO: solo una píldora flotante; la sesión sigue viva ──
  if (minimizado) {
    return (
      <motion.button
        onClick={() => setMinimizado(false)}
        aria-label="Volver a la pantalla del asistente"
        className="fixed bottom-6 right-6 flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-2xl text-white"
        style={{ backgroundColor: '#B47C4D', zIndex: 9998 }}
        initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        <span className="relative flex items-center justify-center w-8 h-8">
          {escuchando && !reduce && (
            <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(255,255,255,0.45)' }} />
          )}
          <Mic className="w-5 h-5 relative z-10" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap">
          Asistente {escuchando ? 'escuchando…' : 'activo'}
        </span>
        {items > 0 && (
          <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-white text-[#B47C4D] text-xs font-bold flex items-center justify-center">
            {items}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'rgba(15,17,21,0.92)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10000 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      {/*
        ── Vincular la compra con su cuenta ──
        El kiosco no sabe quién está enfrente, así que sin esto ninguna compra
        de aquí suma puntos. En vez de pedirle a la gente que escriba su
        contraseña en una pantalla pública —que es regalar contraseñas—, se
        escanea un QR con su propio teléfono, donde ya tiene sesión.
      */}
      <div className="absolute bottom-5 left-5 z-[60]">
        {kiosco.cliente ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-lg"
            style={{ background: 'rgba(20,102,58,0.92)' }}
          >
            <UserCheck className="w-5 h-5 flex-none" />
            <div className="text-left">
              <div className="text-sm font-bold">{kiosco.cliente.nombre}</div>
              <div className="text-xs opacity-80">
                Sus puntos se le acreditan solos · {kiosco.cliente.puntos} pts
              </div>
            </div>
            <button
              onClick={kiosco.desvincular}
              className="ml-1 text-xs underline opacity-80"
              aria-label="Quitar la cuenta de esta compra"
            >
              Quitar
            </button>
          </div>
        ) : kiosco.imagenQR ? (
          <div className="p-3 rounded-2xl bg-white shadow-lg text-center" style={{ width: 190 }}>
            <img src={kiosco.imagenQR} alt={`Código ${kiosco.codigo}`} className="w-full rounded-lg" />
            <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#2A1A0E' }}>
              Escanee para sumar sus puntos
            </p>
            {/* El código escrito es el plan B: si la cámara no agarra, se
                puede teclear en el teléfono. */}
            <p className="text-[13px] font-black tracking-[3px]" style={{ color: '#B46C30' }}>
              {kiosco.codigo}
            </p>
          </div>
        ) : (
          <button
            onClick={kiosco.abrir}
            disabled={kiosco.abriendo}
            className="flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium text-base shadow-lg disabled:opacity-60"
            style={pill}
          >
            <QrCode className="w-5 h-5" />
            {kiosco.abriendo ? 'Generando…' : '¿Tiene cuenta? Sume sus puntos'}
          </button>
        )}
      </div>

      {/* Silenciar / activar la voz */}
      <button
        onClick={toggleMute}
        aria-label={muteado ? 'Activar voz' : 'Silenciar voz'}
        className="absolute top-5 left-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium text-base shadow-lg"
        style={pill}
      >
        {muteado ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        {muteado ? 'Sin voz' : 'Con voz'}
      </button>

      {/* Segundo plano + Salir */}
      <div className="absolute top-5 right-5 z-[60] flex items-center gap-2">
        <button
          onClick={() => setMinimizado(true)}
          aria-label="Poner el asistente en segundo plano"
          className="flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium text-base shadow-lg"
          style={pill}
        >
          <Minimize2 className="w-5 h-5" /> Segundo plano
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold text-base shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.45)' }}
        >
          <X className="w-5 h-5" /> Salir
        </button>
      </div>

      <motion.div
        className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto w-full overflow-y-auto pt-20"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT, delay: 0.05 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Asistente de voz</h1>
        <p className="text-base md:text-lg text-gray-300 mb-6">
          Toca el micrófono y habla. Ej: <span className="text-white font-semibold">"quiero una manzana y dos galletas"</span>
        </p>

        {/* Micrófono con pulso tipo sonar */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-none">
          <AnimatePresence>
            {pulsa && (
              <>
                <motion.span key="ring1" className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(220,38,38,0.5)' }}
                  initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.6, opacity: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />
                <motion.span key="ring2" className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(220,38,38,0.35)' }}
                  initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.6, opacity: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.8 }} />
              </>
            )}
          </AnimatePresence>
          <motion.button
            /*
             * Si está hablando, el toque lo INTERRUMPE y se pone a escuchar.
             * Antes había que aguantarse la frase completa aunque uno ya
             * supiera qué decir; ahora se le corta como a una persona.
             */
            onClick={hablando ? interrumpir : activo ? detener : iniciar}
            className="relative w-full h-full rounded-full flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: micColor }}
            whileTap={{ scale: 0.97 }}
            animate={{ scale: pulsa ? [1, 1.04, 1] : 1 }}
            transition={pulsa ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.16, ease: EASE_OUT }}
            aria-label={hablando ? 'Interrumpir y hablar' : activo ? 'Detener' : 'Empezar a hablar'}
          >
            <Mic className="w-16 h-16 md:w-20 md:h-20 text-white" />
          </motion.button>
        </div>

        <p className="mt-4 text-base md:text-lg font-semibold" style={{ color: estadoColor }}>{estadoTexto}</p>

        {/* Velocidad y voz, uno al lado del otro */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <button onClick={cambiarVelocidad} className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm shadow" style={pill}>
            <Gauge className="w-4 h-4" /> Velocidad: {velLabel}
          </button>

          {/*
            Quién habla. Solo aparece si el sistema tiene más de una voz en
            español: con una sola, un selector de un elemento es un botón que
            no hace nada.

            Al elegir se escucha de una vez — los nombres ("Sabina", "Jorge")
            no le dicen nada a nadie hasta que la oye.
          */}
          {voces.length > 1 && (
            <label className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm shadow cursor-pointer" style={pill}>
              <Volume2 className="w-4 h-4" />
              <span className="sr-only">Voz del asistente</span>
              <select
                value={vozActual}
                onChange={(e) => cambiarVoz(e.target.value)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
                style={{ maxWidth: 190 }}
              >
                {voces.map((v) => (
                  <option key={v.nombre} value={v.nombre} style={{ color: '#111' }}>
                    {v.etiqueta}{v.pais ? ` · ${v.pais}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Transcripción en vivo (mientras escucha) */}
        {escuchando && transcripcion && (
          <p className="mt-4 text-base text-gray-400 italic">…{transcripcion}</p>
        )}

        {/* Historial de la conversación (chat) */}
        {historial.length > 0 && (
          <div ref={chatRef} className="mt-4 w-full max-w-xl overflow-y-auto" style={{ maxHeight: '11rem' }}>
            <div className="flex flex-col gap-2">
              {historial.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                  className={`flex ${m.tipo === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] px-3.5 py-2 rounded-2xl text-sm text-left text-white"
                    style={m.tipo === 'user'
                      ? { backgroundColor: '#B47C4D' }
                      : { backgroundColor: 'rgba(255,255,255,0.10)' }}
                  >
                    {m.texto}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!soportado && (
          <p className="mt-4 text-sm text-red-300">Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.</p>
        )}
      </motion.div>

      {/* Carrito abajo */}
      <motion.div
        className="w-full max-w-3xl mx-auto px-6 pb-6 flex-none"
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT, delay: 0.1 }}
      >
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white text-base font-bold">
              <ShoppingCart className="w-5 h-5" /> Tu carrito ({items})
            </div>
            <div className="text-xl font-extrabold text-white">${totalCarrito.toFixed(2)}</div>
          </div>
          {carrito.length === 0 ? (
            <p className="text-gray-400 text-sm">Aún no has agregado nada. ¡Dime qué quieres!</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
              {carrito.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: reduce ? 0 : -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="flex items-center justify-between text-white text-sm">
                  <span>{item.emoji ? `${item.emoji} ` : ''}{item.cantidad}× {item.nombre}</span>
                  <span className="text-gray-300">${(item.precio * item.cantidad).toFixed(2)}</span>
                </motion.div>
              ))}
            </div>
          )}
          <p className="text-gray-400 text-xs mt-2">Di <span className="text-white font-semibold">"comprar"</span> cuando termines — un empleado te ayudará a pagar.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AsistenteVoz;
