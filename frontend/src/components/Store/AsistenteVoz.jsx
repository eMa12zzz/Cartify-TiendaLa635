import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, X, ShoppingCart, Volume2, VolumeX, Minimize2, QrCode, UserCheck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useKiosco } from '../../hooks/useKiosco';
import { orderService } from '../../api/orderService';

/*
 * AsistenteVoz — pantalla grande (kiosco) del asistente por voz.
 * Solo pinta; la lógica vive en useVoiceAssistant. Animaciones con la vara de
 * Emil (ease-out fuerte, <300ms, respeta prefers-reduced-motion).
 *
 * EL ASPECTO ES EL DE LA LANDING PAGE: fondo negro con una luz azul detrás, un
 * escenario redondeado con el orbe del micrófono y sus anillos, la onda de
 * barras, el chat en burbujas (la persona en blanco, el asistente en azul
 * tenue) y el carrito con la foto de cada producto. Los bucles (anillos, onda,
 * puntos de "pensando") viven en index.css; aquí solo se elige la clase de
 * estado.
 */
const EASE_OUT = [0.23, 1, 0.32, 1];

// La luz azul detrás del micrófono y el negro del resto, como en la landing.
const FONDO =
  'radial-gradient(900px 620px at 50% 26%, rgba(0, 92, 138, 0.38), transparent 62%), #000';

const ESCENARIO = {
  background:
    'radial-gradient(circle at 50% 14%, rgba(255,255,255,0.10), transparent 42%), linear-gradient(180deg, #071824, #010407)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 60px 120px -40px rgba(0, 154, 235, 0.28)',
};

/*
 * El orbe va SIEMPRE en el azul de la casa, no en --marca-600: en diciembre
 * esa variable es verde y en Halloween naranja, y un orbe naranja encima de
 * esta luz azul se ve como un error. La temporada ya se nota en la tienda.
 */
const ORBE = 'radial-gradient(circle at 34% 28%, #29a3e6, #003049 68%)';

// Botones de vidrio de las esquinas.
const VIDRIO = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

/*
 * Las barras de la onda: más altas al centro, y cada una con su propio ritmo
 * y desfase para que no suban todas a la vez. Con fórmula y no con
 * Math.random(): así no saltan de sitio cada vez que React vuelve a pintar.
 */
const BARRAS = Array.from({ length: 28 }, (_, i) => {
  const centro = 13.5;
  const cercania = 1 - Math.abs(i - centro) / centro;
  return {
    alto: Math.round(14 + 32 * cercania),
    duracion: `${(0.6 + ((i * 7) % 5) * 0.12).toFixed(2)}s`,
    retraso: `-${(((i * 13) % 10) * 0.09).toFixed(2)}s`,
  };
});

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
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    iniciar, detener, toggleMute, hablar, soportado, interrumpir,
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
        /*
         * El código es lo que le PRUEBA al servidor de quién es este pedido.
         *
         * El kiosco no tiene sesión —ni debe tenerla: esa es toda la gracia de
         * que el cliente escanee con su teléfono y la contraseña nunca pase
         * por la pantalla pública—. Antes bastaba con mandar un clientId y el
         * servidor le creía, así que se le podía cargar una compra a
         * cualquiera. Ahora el servidor busca el código, mira que siga
         * vinculada y sin usar, y saca el cliente de ahí.
         *
         * Va antes de `kiosco.cerrar()`, que quema el código en el `finally`.
         */
        codigoKiosco: kiosco.codigo,
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
  const carritoRef = useRef(null);

  /*
   * Al abrir, el asistente NO habla solo: espera a que la persona toque el
   * micrófono. Antes soltaba un saludo hablado apenas se abría, que sorprendía
   * y a veces hablaba encima de quien ya sabía qué pedir. La instrucción de qué
   * hacer ya está escrita grande en la pantalla.
   */
  useEffect(() => {
    toast.dismiss();
  }, []);

  // Auto-scroll del chat al último mensaje (y a la transcripción en vivo).
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [historial, transcripcion, pensando]);

  // Lo último que entró al carrito queda a la vista.
  useEffect(() => {
    if (carritoRef.current) carritoRef.current.scrollTop = carritoRef.current.scrollHeight;
  }, [carrito.length]);

  const items = carrito.reduce((a, i) => a + i.cantidad, 0);

  /*
   * "Pensando" va primero: cuando la IA está descifrando la frase pasa cerca
   * de un segundo en silencio, y sin avisar eso se lee como que el asistente
   * se colgó. Decirlo convierte la espera en algo que está pasando.
   */
  const estadoTexto = pensando
    ? 'Buscando productos…'
    : hablando ? 'Toque para interrumpir'
    : !activo ? 'Toque el micrófono y hable'
    : escuchando ? 'Escuchando…' : 'Un momento…';

  // La clase que mueve los anillos, la onda y el orbe (ver index.css).
  const claseEstado = pensando
    ? 'asis-pensando'
    : hablando ? 'asis-hablando'
    : escuchando ? 'asis-escuchando' : '';

  const brilloOrbe = escuchando
    ? 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 0 0 10px rgba(0,154,235,0.18), 0 24px 90px 0 rgba(0,154,235,0.75)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.2), 0 24px 70px -10px rgba(0,154,235,0.6)';

  // ── Modo SEGUNDO PLANO: solo una píldora flotante; la sesión sigue viva ──
  if (minimizado) {
    return (
      <motion.button
        onClick={() => setMinimizado(false)}
        aria-label="Volver a la pantalla del asistente"
        className={`fixed bottom-6 right-6 flex items-center gap-3 pl-2.5 pr-5 py-2.5 rounded-full text-white ${claseEstado}`}
        style={{
          background: 'rgba(6, 18, 26, 0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 50px -12px rgba(0, 154, 235, 0.45)',
          zIndex: 9998,
        }}
        initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        <span className="relative grid place-items-center w-11 h-11">
          <span className="asis-anillo" style={{ inset: 0 }} />
          <span
            className="asis-orbe relative z-10 grid place-items-center w-10 h-10 rounded-full"
            style={{ background: ORBE }}
          >
            <Mic className="w-5 h-5" />
          </span>
        </span>
        <span className="text-sm font-semibold whitespace-nowrap">
          Asistente {escuchando ? 'escuchando…' : 'activo'}
        </span>
        {items > 0 && (
          <span className="min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#8ecbe8', color: '#001a29' }}>
            {items}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed inset-0 flex flex-col text-white ${claseEstado}`}
      style={{ background: FONDO, zIndex: 10000 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: EASE_OUT }}
    >
      {/* Silenciar / activar la voz */}
      <button
        onClick={toggleMute}
        aria-label={muteado ? 'Activar voz' : 'Silenciar voz'}
        className="absolute top-5 left-5 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm md:text-base transition-colors hover:bg-white/10"
        style={VIDRIO}
      >
        {muteado ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        {muteado ? 'Sin voz' : 'Con voz'}
      </button>

      {/* Segundo plano + Salir */}
      <div className="absolute top-5 right-5 z-[60] flex items-center gap-2">
        <button
          onClick={() => setMinimizado(true)}
          aria-label="Poner el asistente en segundo plano"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm md:text-base transition-colors hover:bg-white/10"
          style={VIDRIO}
        >
          <Minimize2 className="w-5 h-5" /> <span className="hidden sm:inline">Segundo plano</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm md:text-base bg-white transition-transform active:scale-95"
          style={{ color: '#001a29' }}
        >
          <X className="w-5 h-5" /> Salir
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <motion.div
          className="mx-auto w-full max-w-2xl px-5 pt-24 md:pt-20 pb-24 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: reduce ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: '#6fb3d9' }}>
            Asistente de voz
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight leading-none">
            Compre hablando.
          </h1>
          <p className="mt-3 text-base md:text-lg" style={{ color: 'rgba(255,255,255,0.64)' }}>
            Toque el micrófono y dígale lo que necesita. Por ejemplo:{' '}
            <span className="text-white font-semibold">“quiero una manzana y dos galletas”</span>
          </p>

          {/* ── El escenario ── */}
          <div className="relative w-full mt-6 rounded-[34px] px-5 md:px-8 pt-6 pb-5 flex flex-col items-center" style={ESCENARIO}>
            {/* Orbe del micrófono con anillos */}
            <div className="relative w-[170px] h-[170px] grid place-items-center flex-none">
              <span className="asis-anillo" />
              <span className="asis-anillo" />
              <span className="asis-anillo" />
              <motion.button
                /*
                 * Si está hablando, el toque lo INTERRUMPE y se pone a escuchar.
                 * Antes había que aguantarse la frase completa aunque uno ya
                 * supiera qué decir; ahora se le corta como a una persona.
                 */
                onClick={hablando ? interrumpir : activo ? detener : iniciar}
                className="asis-orbe relative z-10 w-[118px] h-[118px] rounded-full grid place-items-center"
                style={{
                  background: ORBE,
                  boxShadow: brilloOrbe,
                  transition: 'box-shadow 300ms ease-out',
                }}
                whileHover={reduce ? undefined : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                aria-label={hablando ? 'Interrumpir y hablar' : activo ? 'Detener' : 'Empezar a hablar'}
              >
                <Mic className="w-11 h-11 text-white" />
              </motion.button>
            </div>

            {/* La onda */}
            <div className="flex items-center gap-1 h-12 mt-3" aria-hidden="true">
              {BARRAS.map((b, i) => (
                <i
                  key={i}
                  className="asis-barra"
                  style={{ height: b.alto, '--d': b.duracion, '--r': b.retraso }}
                />
              ))}
            </div>

            <p className="mt-2 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.62)' }} aria-live="polite">
              {estadoTexto}
            </p>

            {/*
              Quién habla. Solo aparece si el sistema tiene más de una voz en
              español: con una sola, un selector de un elemento es un botón que
              no hace nada.

              Al elegir se escucha de una vez — los nombres ("Sabina", "Jorge")
              no le dicen nada a nadie hasta que la oye.
            */}
            {voces.length > 1 && (
              <label className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full text-sm cursor-pointer" style={VIDRIO}>
                <Volume2 className="w-4 h-4" style={{ color: '#6fb3d9' }} />
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

            {/* ── La conversación ── */}
            <div
              ref={chatRef}
              className="w-full mt-5 overflow-y-auto flex flex-col gap-2.5"
              style={{ minHeight: '4.5rem', maxHeight: '15rem' }}
            >
              {historial.length === 0 && !(escuchando && transcripcion) && !pensando && (
                <p className="m-auto text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Aquí va a ver lo que dice y lo que le contesta el asistente.
                </p>
              )}

              {historial.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className={`flex ${m.tipo === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-4 py-2.5 text-[15px] leading-snug text-left"
                    style={m.tipo === 'user'
                      ? { backgroundColor: '#fff', color: '#001a29', borderRadius: '20px 20px 6px 20px' }
                      : {
                        backgroundColor: 'rgba(111,179,217,0.13)',
                        border: '1px solid rgba(111,179,217,0.22)',
                        color: '#e3f1f9',
                        borderRadius: '20px 20px 20px 6px',
                      }}
                  >
                    {m.tipo === 'user' ? `“${m.texto}”` : m.texto}
                  </div>
                </motion.div>
              ))}

              {/* Lo que va diciendo, mientras lo dice */}
              {escuchando && transcripcion && (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] px-4 py-2.5 text-[15px] leading-snug text-left italic"
                    style={{ backgroundColor: 'rgba(255,255,255,0.85)', color: '#001a29', borderRadius: '20px 20px 6px 20px' }}
                  >
                    “{transcripcion}…”
                  </div>
                </div>
              )}

              {pensando && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-2.5"
                    style={{ backgroundColor: 'rgba(111,179,217,0.13)', border: '1px solid rgba(111,179,217,0.22)', borderRadius: '20px 20px 20px 6px' }}
                    aria-label="El asistente está pensando"
                  >
                    <span className="asis-escribiendo"><i /><i /><i /></span>
                  </div>
                </div>
              )}
            </div>

            {!soportado && (
              <p className="mt-3 text-sm" style={{ color: '#fca5a5' }}>
                Su navegador no reconoce la voz. Use Chrome o Edge.
              </p>
            )}

            {/* ── El carrito ── */}
            <div
              className="w-full mt-5 rounded-[22px] p-4 text-left"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <ShoppingCart className="w-5 h-5" /> Su carrito ({items})
                </span>
                <span className="text-xl font-bold tabular-nums" style={{ color: '#8ecbe8' }}>
                  ${totalCarrito.toFixed(2)}
                </span>
              </div>

              {carrito.length === 0 ? (
                <p className="text-sm py-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Todavía no hay nada. Dígale al asistente qué quiere.
                </p>
              ) : (
                <div ref={carritoRef} className="flex flex-col max-h-48 overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {carrito.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: reduce ? 0 : -24, backgroundColor: 'rgba(0,154,235,0.25)' }}
                        animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,154,235,0)' }}
                        exit={{ opacity: 0, x: reduce ? 0 : 24 }}
                        transition={{ duration: 0.45, ease: EASE_OUT }}
                        className="grid items-center gap-3 py-2 rounded-lg"
                        style={{ gridTemplateColumns: '40px 1fr auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className="w-10 h-10 rounded-[10px] bg-white grid place-items-center overflow-hidden">
                          {item.imagen
                            ? <img src={item.imagen} alt="" className="w-[78%] h-[78%] object-contain" />
                            : <Package className="w-5 h-5" style={{ color: '#9C9691' }} />}
                        </span>
                        <span className="text-sm min-w-0 truncate">
                          {item.nombre}
                          <span className="ml-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>×{item.cantidad}</span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums">${(item.precio * item.cantidad).toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Diga <span className="text-white font-semibold">“comprar”</span> cuando termine — un empleado le ayudará a pagar.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/*
        ── Vincular la compra con su cuenta ──
        El kiosco no sabe quién está enfrente, así que sin esto ninguna compra
        de aquí suma puntos. En vez de pedirle a la gente que escriba su
        contraseña en una pantalla pública —que es regalar contraseñas—, se
        escanea un QR con su propio teléfono, donde ya tiene sesión.

        No sale en pantallas de teléfono: ahí quien usa el asistente ya está en
        SU teléfono (con su sesión), y el botón flotante tapaba el carrito.
      */}
      <div className="absolute bottom-5 left-5 z-[60] hidden sm:block">
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
            <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#1C1614' }}>
              Escanee para sumar sus puntos
            </p>
            {/* El código escrito es el plan B: si la cámara no agarra, se
                puede teclear en el teléfono. */}
            <p className="text-[13px] font-black tracking-[3px]" style={{ color: 'var(--marca-600)' }}>
              {kiosco.codigo}
            </p>
          </div>
        ) : (
          <button
            onClick={kiosco.abrir}
            disabled={kiosco.abriendo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-medium text-sm md:text-base disabled:opacity-60 transition-colors hover:bg-white/10"
            style={VIDRIO}
          >
            <QrCode className="w-5 h-5" style={{ color: '#6fb3d9' }} />
            {kiosco.abriendo ? 'Generando…' : '¿Tiene cuenta? Sume sus puntos'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AsistenteVoz;
