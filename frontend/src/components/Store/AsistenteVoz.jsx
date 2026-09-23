import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, X, ShoppingCart, Volume2, VolumeX, Minimize2, QrCode, UserCheck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useKiosco } from '../../hooks/useKiosco';
import { orderService } from '../../api/orderService';
import { aiService } from '../../api/aiService';
import MascotaAsistente from './MascotaAsistente';

/*
 * AsistenteVoz — pantalla grande (kiosco) del asistente por voz.
 * Solo pinta; la lógica vive en useVoiceAssistant. Animaciones con la vara de
 * Emil (ease-out fuerte, <300ms, respeta prefers-reduced-motion).
 *
 * SE LE HABLA A LA MASCOTA. En vez de un orbe con un micrófono, al centro está
 * la etiqueta del logo con cara (MascotaAsistente): mira a quien tiene
 * enfrente, asiente mientras le hablan, piensa, contesta moviendo la boca y
 * pone cara según cómo le fue. Es una conversación cara a cara, así que solo
 * se ve el último intercambio: lo que dijo la mascota en su globo y lo que
 * dijo la persona debajo. El resultado de todo lo dicho queda en el carrito.
 *
 * El fondo sigue siendo el de la landing: negro con una luz azul detrás.
 */
const EASE_OUT = [0.23, 1, 0.32, 1];

// La luz azul detrás de la mascota y el negro del resto, como en la landing.
const FONDO =
  'radial-gradient(900px 620px at 50% 26%, rgba(0, 92, 138, 0.38), transparent 62%), #000';

/*
 * El botón del micrófono va SIEMPRE en el azul de la casa, no en
 * --marca-600: en diciembre esa variable es verde y en Halloween naranja, y
 * un botón naranja encima de esta luz azul se ve como un error. La temporada
 * ya se nota en la tienda.
 */
const ORBE = 'radial-gradient(circle at 34% 28%, #29a3e6, #003049 68%)';

/*
 * Lo que dice la mascota antes de que le hablen. Va escrito y NO hablado: al
 * abrir, el asistente espera a que la persona toque (ver más abajo).
 */
const SALUDO = '¡Hola! Toque el botón y dígame qué necesita. Por ejemplo: “quiero una manzana y dos galletas”.';

/*
 * La cara que pone la mascota según lo último que dijo.
 *
 * Sale del texto porque el hook no avisa aparte si entendió o no. Si cambian
 * estas frases en useVoiceAssistant (o en cerrarCompra, aquí abajo), hay que
 * mirar aquí también; lo peor que pasa si no coinciden es que la mascota
 * ponga cara normal.
 */
const animoDe = (texto = '') => {
  if (/^¡Listo/.test(texto)) return 'feliz'; // la compra quedó cerrada
  if (/^Agregué/.test(texto)) return 'contento';
  if (/^(No le entendí|No encontré|No tienes|No pude|Tu navegador no)/.test(texto)) return 'confundido';
  return 'normal';
};

// Botones de vidrio de las esquinas.
const VIDRIO = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

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

  const carritoRef = useRef(null);

  /*
   * Al abrir, el asistente NO habla solo: espera a que la persona toque el
   * micrófono. Antes soltaba un saludo hablado apenas se abría, que sorprendía
   * y a veces hablaba encima de quien ya sabía qué pedir. La instrucción de qué
   * hacer ya está escrita grande en la pantalla.
   */
  useEffect(() => {
    toast.dismiss();
    // Despierta el servidor mientras la persona lee la pantalla: si estaba
    // dormido, la primera pregunta ya no tarda medio minuto. Ver aiService.
    aiService.despertar();
  }, []);

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
    : !activo ? 'Toque para hablarle'
    : escuchando ? 'Le escucho…' : 'Un momento…';

  // Qué hace la mascota, con el mismo orden que el texto de arriba.
  const estadoMascota = pensando ? 'pensando'
    : hablando ? 'hablando'
    : escuchando ? 'escuchando' : 'reposo';

  // El último intercambio: lo que dijo la mascota y lo que dijo la persona.
  const ultimoBot = [...historial].reverse().find((m) => m.tipo !== 'user');
  const ultimoUser = [...historial].reverse().find((m) => m.tipo === 'user');

  // Mientras la escucha o piensa, cara neutra: la de antes era de otra frase.
  const animo = escuchando || pensando ? 'normal' : animoDe(ultimoBot?.texto);

  // Lo de la persona: en vivo mientras habla, y si no, lo último que dijo.
  const enVivo = escuchando && !!transcripcion;
  const textoPersona = enVivo ? transcripcion : ultimoUser?.texto;

  /*
   * Tocar a la mascota o al botón hace lo mismo que el orbe de antes. Si está
   * hablando, el toque la INTERRUMPE y se pone a escuchar: ya no hay que
   * aguantarse la frase completa aunque uno ya sepa qué decir.
   */
  const alTocar = hablando ? interrumpir : activo ? detener : iniciar;
  const etiquetaToque = hablando ? 'Interrumpir y hablar' : activo ? 'Detener' : 'Empezar a hablar';

  const brilloOrbe = escuchando
    ? 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 0 0 10px rgba(0,154,235,0.18), 0 24px 90px 0 rgba(0,154,235,0.75)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.2), 0 24px 70px -10px rgba(0,154,235,0.6)';

  // ── Modo SEGUNDO PLANO: solo una píldora flotante; la sesión sigue viva ──
  if (minimizado) {
    return (
      <motion.button
        onClick={() => setMinimizado(false)}
        aria-label="Volver a la pantalla del asistente"
        className="fixed bottom-6 right-6 flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-full text-white"
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
        {/* La misma mascota, en chico: sigue escuchando con su cara. */}
        <span className="grid place-items-center w-9 h-11 flex-none">
          <MascotaAsistente compacta estado={estadoMascota} animo={animo} latido={transcripcion} className="h-11 w-auto" />
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
      className="fixed inset-0 flex flex-col text-white"
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

          {/*
            Todo va directo sobre el fondo, sin un recuadro que lo encierre:
            la mascota, lo que se dicen y el carrito se separan con aire y una
            línea fina, no con cajas.
          */}
          <div className="relative w-full mt-6 flex flex-col items-center">
            {/* ── La mascota y lo que dice ── */}
            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-5 md:gap-6">
              {/*
                La mascota también se toca, como el orbe de antes. Para el
                teclado queda solo el botón del micrófono: dos controles que
                hacen lo mismo serían un tab de más.
              */}
              <button
                type="button"
                onClick={alTocar}
                tabIndex={-1}
                aria-hidden="true"
                className="flex-none w-[170px] md:w-[210px] outline-none"
              >
                <MascotaAsistente
                  estado={estadoMascota}
                  animo={animo}
                  latido={transcripcion}
                  className="w-full h-auto block"
                />
              </button>

              <motion.div
                key={pensando ? 'pensando' : (ultimoBot?.id ?? 'saludo')}
                className="masc-globo relative w-full max-w-[420px] md:w-auto md:flex-1 md:max-w-[340px] px-[22px] py-[18px] rounded-3xl text-left text-lg md:text-xl font-medium leading-snug"
                style={{ backgroundColor: '#fff', color: '#001a29' }}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                // Mientras la persona habla, el globo se apaga: ahora le toca a ella.
                animate={{ opacity: escuchando ? 0.38 : 1, scale: 1 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                {pensando
                  ? <span className="masc-puntos" aria-label="El asistente está pensando"><i /><i /><i /></span>
                  : (ultimoBot?.texto || SALUDO)}
              </motion.div>
            </div>

            {/* ── Lo que dice la persona: en vivo, con cursor, mientras habla ── */}
            <div className="w-full flex justify-end mt-4 min-h-[52px]">
              {textoPersona && (
                <div
                  className={`max-w-[85%] px-[18px] py-3 text-base md:text-[17px] leading-snug text-left ${enVivo ? 'italic' : ''}`}
                  style={{
                    backgroundColor: 'rgba(111,179,217,0.14)',
                    border: '1px solid rgba(111,179,217,0.3)',
                    color: '#e3f1f9',
                    borderRadius: '22px 22px 6px 22px',
                    opacity: hablando ? 0.45 : 1,
                    transition: 'opacity 250ms ease-out',
                  }}
                >
                  “{textoPersona}{enVivo ? <span className="masc-cursor" /> : '”'}
                </div>
              )}
            </div>

            {/* ── El botón para hablarle ── */}
            <motion.button
              onClick={alTocar}
              className={`relative mt-4 w-[76px] h-[76px] rounded-full grid place-items-center flex-none ${escuchando ? 'masc-mic-escuchando' : ''}`}
              style={{
                background: ORBE,
                boxShadow: brilloOrbe,
                transition: 'box-shadow 300ms ease-out',
              }}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
              aria-label={etiquetaToque}
            >
              <span className="masc-mic-onda" />
              <Mic className="w-8 h-8 text-white" />
            </motion.button>

            <p className="mt-2.5 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.62)' }} aria-live="polite">
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

            {!soportado && (
              <p className="mt-3 text-sm" style={{ color: '#fca5a5' }}>
                Su navegador no reconoce la voz. Use Chrome o Edge.
              </p>
            )}

            {/* ── El carrito ── */}
            <div
              className="w-full mt-6 pt-5 text-left"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
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
