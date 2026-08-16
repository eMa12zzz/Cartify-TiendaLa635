import { useRef, useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { aiService } from '../api/aiService';

/*
 * useVoiceAssistant — el "cerebro" del asistente por voz (Modo Kiosco).
 *
 * Funciones:
 *   - Escucha continua (manos libres) + transcripción en vivo.
 *   - Voz bidireccional con barge-in, MUTE y VELOCIDAD configurable.
 *   - Matcher local con SINÓNIMOS y VARIOS productos por frase.
 *   - No dice el total al agregar (solo cuando lo piden).
 *   - CONFIRMA antes de comprar ("¿seguro? di sí").
 *   - UPSELL: sugiere un producto en oferta (una vez).
 *   - RE-PREGUNTA si hay silencio.
 *   - Guarda el HISTORIAL de la conversación (para el chat en pantalla).
 */

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

// Apodos/sinónimos → palabra que sí aparece en el nombre del producto.
const SINONIMOS = {
  refresco: ['gaseosa', 'soda', 'cola', 'coca'],
  platano: ['banano', 'guineo'],
  galletas: ['galleta'],
  churritos: ['churros', 'churro'],
  yogurt: ['yogur'],
  manzana: ['mansana'],
};

// Velocidades de la voz (para la tercera edad, "Lenta" ayuda mucho).
const VELOCIDADES = [
  { v: 0.8, label: 'Lenta' },
  { v: 0.95, label: 'Normal' },
  { v: 1.15, label: 'Rápida' },
];

/*
 * PACIENCIA CON EL SILENCIO.
 * El asistente no debe repetir "¿sigue ahí?" a cada rato: fastidia y se siente
 * como que apura. Solo re-pregunta tras VARIOS silencios seguidos Y si ya pasó
 * un buen rato desde la última vez. Entre medio sigue escuchando calladito.
 */
const SILENCIOS_ANTES_DE_PREGUNTAR = 3;      // silencios seguidos antes de hablar
const SILENCIO_COOLDOWN_MS = 30000;          // y no más seguido que cada 30 s
const REINTENTO_SILENCIO_MS = 900;           // cada cuánto vuelve a escuchar en silencio

/*
 * ============================================================
 * LAS VOCES
 * ============================================================
 * Antes se agarraba la PRIMERA voz en español que tuviera el navegador y ya.
 * En Windows esa suele ser Sabina o Helena, y a quien no le gusta se aguanta.
 *
 * Las voces no las ponemos nosotros: son las que el sistema tiene instaladas,
 * así que la lista cambia de una computadora a otra y de un teléfono a otro.
 * Por eso se leen del navegador en vez de tener una lista fija nuestra.
 *
 * Ojo con `getVoices()`: la primera vez casi siempre devuelve una lista vacía
 * porque el navegador todavía las está cargando, y avisa después con el
 * evento `voiceschanged`. Ese detalle es la razón de que a veces "no había
 * voces" y sonaba la de por defecto.
 */
const LLAVE_VOZ = 'kartify:voz-asistente';

// Nombre limpio para mostrar: los del sistema vienen como
// "Microsoft Sabina - Spanish (Mexico)" o "Google español de Estados Unidos".
const nombreBonito = (voz) => {
  if (!voz) return '';
  const limpio = voz.name
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s*-\s*Spanish.*$/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();

  /*
   * Las de Google no tienen nombre propio: se llaman "español" o "español de
   * Estados Unidos". Dejarlas así daba etiquetas como "español de Estados
   * Unidos · Estados Unidos", repitiendo el país dos veces. Se les pone
   * "Español" a secas y el país va aparte, igual que a las demás.
   */
  if (/^español/i.test(limpio)) return 'Español';

  return limpio || voz.name;
};

// De qué país es la voz, que es lo que de verdad cambia cómo suena.
const paisDeVoz = (voz) => {
  const region = (voz?.lang || '').split('-')[1];
  const paises = {
    SV: 'El Salvador', MX: 'México', ES: 'España', US: 'Estados Unidos',
    AR: 'Argentina', CO: 'Colombia', CL: 'Chile', PE: 'Perú',
    VE: 'Venezuela', GT: 'Guatemala', CR: 'Costa Rica', PA: 'Panamá',
    DO: 'Rep. Dominicana', EC: 'Ecuador', UY: 'Uruguay', PY: 'Paraguay',
    BO: 'Bolivia', HN: 'Honduras', NI: 'Nicaragua', PR: 'Puerto Rico',
    CU: 'Cuba',
  };
  return paises[region] || region || '';
};

/*
 * Las voces del sistema, leídas como lo que son: estado que vive FUERA de
 * React. La caché por nombres es obligatoria — `getVoices()` devuelve un
 * arreglo nuevo en cada llamada, y sin comparar contenido React entraría en
 * un ciclo infinito de renders.
 */
let cacheVoces = [];
let cacheClave = '';

const leerVocesDelSistema = () => {
  const lista = (typeof window !== 'undefined' && window.speechSynthesis?.getVoices?.()) || [];
  const soloEs = lista.filter((v) => (v.lang || '').toLowerCase().startsWith('es'));
  const clave = soloEs.map((v) => v.name).join('|');
  if (clave !== cacheClave) {
    cacheClave = clave;
    cacheVoces = soloEs;
  }
  return cacheVoces;
};

const suscribirVoces = (avisar) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return () => {};
  // La lista llega tarde: el navegador avisa con este evento cuando termina
  // de cargarlas. Sin escucharlo, el primer render se queda sin voces.
  window.speechSynthesis.addEventListener('voiceschanged', avisar);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', avisar);
};

const SIN_VOCES = [];

const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => sinAcentos(s).toLowerCase().trim();
const contarItems = (lista) => lista.reduce((a, i) => a + i.cantidad, 0);

const cantidadExplicita = (texto) => {
  const t = normalizar(texto);
  const d = t.match(/\b(\d+)\b/);
  if (d) return parseInt(d[1], 10);
  for (const [p, n] of Object.entries(NUMEROS)) {
    if (new RegExp(`\\b${p}\\b`).test(t)) return n;
  }
  return null;
};

// Si en la frase aparece un apodo, le añadimos la palabra "buena" para el match.
const expandirSinonimos = (t) => {
  let out = t;
  for (const [canon, syns] of Object.entries(SINONIMOS)) {
    for (const s of syns) {
      if (new RegExp(`\\b${s}\\b`).test(out)) out += ' ' + canon;
    }
  }
  return out;
};

/*
 * ============================================================
 * LLEVARLO A DONDE PIDIÓ
 * ============================================================
 * Las secciones de la cuenta a las que se puede ir hablando. La clave son las
 * palabras que la gente usa de verdad, no el nombre del menú: nadie dice
 * "llévame a Puntos de fidelidad", dice "cuántos puntos llevo".
 */
const DESTINOS_CUENTA = [
  { ruta: '/mi-cuenta/pedidos',        palabras: /\b(mis pedidos|mi pedido|pedidos|ordenes|compras)\b/, nombre: 'sus pedidos' },
  { ruta: '/mi-cuenta/puntos',         palabras: /\b(puntos|fidelidad|premios)\b/,                      nombre: 'sus puntos' },
  { ruta: '/mi-cuenta/favoritos',      palabras: /\b(favoritos|guardados|me gusta)\b/,                  nombre: 'sus favoritos' },
  { ruta: '/mi-cuenta/direcciones',    palabras: /\b(direcciones|direccion|donde vivo)\b/,              nombre: 'sus direcciones' },
  { ruta: '/mi-cuenta/pagos',          palabras: /\b(pagos|tarjetas|saldo|metodos de pago)\b/,          nombre: 'sus métodos de pago' },
  { ruta: '/mi-cuenta/recibidos',      palabras: /\b(recibos|facturas|comprobantes)\b/,                 nombre: 'sus recibos' },
  { ruta: '/mi-cuenta/notificaciones', palabras: /\b(notificaciones|avisos|alertas)\b/,                 nombre: 'sus avisos' },
  { ruta: '/mi-cuenta',                palabras: /\b(mi cuenta|mis datos|mi perfil)\b/,                 nombre: 'su cuenta' },
];

// Cómo pide la gente que la lleven a algún lado.
const PIDE_IR = /\b(ver|vamos|llevame|llévame|muestrame|muéstrame|enseñame|enséñame|abrir|abre|quiero ver|busca|buscar|donde esta|dónde está|ir a)\b/;

export const useVoiceAssistant = ({
  productos = [], carrito = [], totalCarrito = 0,
  agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
  // A dónde puede llevar a la persona. Los pone la tienda, que es la que
  // sabe abrir un producto o cambiar de categoría sin recargar la página.
  irAProducto, irACategoria, irARuta, categorias = [],
  // Qué hacer cuando la persona confirma la compra. Lo pone quien monta el
  // asistente, porque de eso dependen el pedido y los puntos.
  alConfirmarCompra,
}) => {
  const [activo, setActivo] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [muteado, setMuteado] = useState(false);
  const [velIndex, setVelIndex] = useState(1); // Normal

  /*
   * La voz elegida se guarda por NOMBRE y no por posición: la lista del
   * sistema cambia de orden entre navegadores, y guardar un índice hacía que
   * mañana sonara otra persona.
   */
  const vocesDelSistema = useSyncExternalStore(suscribirVoces, leerVocesDelSistema, () => SIN_VOCES);
  const [vozElegida, setVozElegida] = useState(() => {
    try { return localStorage.getItem(LLAVE_VOZ) || ''; } catch { return ''; }
  });
  const [transcripcion, setTranscripcion] = useState('');
  // Mientras la IA descifra la frase: la pantalla lo dice para que el
  // silencio de un segundo no se lea como que el asistente se colgó.
  const [pensando, setPensando] = useState(false);
  // Si está hablando ahora mismo. La pantalla lo usa para ofrecer
  // interrumpirlo en vez de detenerlo.
  const [hablando, setHablando] = useState(false);
  const [historial, setHistorial] = useState([]);

  const dataRef = useRef({ productos, carrito, totalCarrito, categorias });
  dataRef.current = { productos, carrito, totalCarrito, categorias };
  const fnRef = useRef({});
  fnRef.current = {
    agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
    irAProducto, irACategoria, irARuta, alConfirmarCompra,
  };

  const recognitionRef = useRef(null);
  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const muteRef = useRef(false); muteRef.current = muteado;
  const rateRef = useRef(0.95); rateRef.current = VELOCIDADES[velIndex].v;
  // El que habla se lee por ref: quien pronuncia se decide al momento de
  // hablar, no cuando se registró la función.
  const vozRef = useRef(''); vozRef.current = vozElegida;
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null);
  const hablarRef = useRef(null);
  const confirmandoRef = useRef(false); // esperando "sí" para comprar
  const silencioRef = useRef(0);
  const ultimoSiguesRef = useRef(0);    // cuándo preguntó "¿sigue ahí?" por última vez
  const sugeridoRef = useRef(false);     // ya hicimos upsell esta sesión
  const idRef = useRef(0);

  const soportado =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Agrega un mensaje al historial (limita a los últimos 8).
  const registrar = (tipo, texto) => {
    setHistorial((h) => [...h.slice(-7), { id: idRef.current++, tipo, texto }]);
  };

  const arrancarReconocimiento = useCallback(() => {
    if (!soportado || !activoRef.current) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    hablandoRef.current = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-SV';
    rec.continuous = false;
    rec.interimResults = true;
    let finalTexto = '';

    rec.onstart = () => setEscuchando(true);
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTexto += t;
        else interim += t;
      }
      setTranscripcion(finalTexto || interim);
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => {
      setEscuchando(false);
      if (finalTexto.trim()) {
        procesarRef.current?.(finalTexto.trim());
      } else if (activoRef.current && !hablandoRef.current) {
        /*
         * Silencio. El asistente es paciente: sigue escuchando calladito y solo
         * re-pregunta muy de vez en cuando. Hacen falta varios silencios
         * seguidos Y que haya pasado el cooldown desde la última vez que
         * preguntó; si no, vuelve a escuchar sin decir nada.
         */
        silencioRef.current += 1;
        const ahora = Date.now();
        const toca =
          silencioRef.current >= SILENCIOS_ANTES_DE_PREGUNTAR &&
          ahora - ultimoSiguesRef.current >= SILENCIO_COOLDOWN_MS;

        if (toca) {
          silencioRef.current = 0;
          ultimoSiguesRef.current = ahora;
          hablarRef.current?.('Aquí sigo cuando me necesites. Toca el micrófono y dime qué quieres llevar.');
        } else {
          setTimeout(() => arrancarReconocimiento(), REINTENTO_SILENCIO_MS);
        }
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ya estaba iniciado */ }
  }, [soportado]);

  const hablar = useCallback((texto) => {
    ultimaRespuestaRef.current = texto;
    registrar('bot', texto);

    const continuar = () => {
      hablandoRef.current = false;
      setHablando(false);
      if (activoRef.current) setTimeout(() => arrancarReconocimiento(), 350);
    };

    if (muteRef.current || typeof window === 'undefined' || !window.speechSynthesis) {
      continuar();
      return;
    }

    window.speechSynthesis.cancel();
    hablandoRef.current = true;
    setHablando(true);
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-SV';
    u.rate = rateRef.current;
    /*
     * La voz que eligió la persona; si esa ya no está (cambió de computadora,
     * la desinstalaron), se cae a la primera en español en vez de quedarse
     * muda o hablar en inglés.
     */
    const enEspanol = leerVocesDelSistema();
    const elegida = enEspanol.find((v) => v.name === vozRef.current);
    const voz = elegida || enEspanol[0];
    if (voz) {
      u.voice = voz;
      // El idioma tiene que ir con la voz: dejar es-SV con una voz de España
      // hace que algunos navegadores la ignoren y hablen en inglés.
      u.lang = voz.lang;
    }
    u.onend = continuar;
    u.onerror = continuar;
    window.speechSynthesis.speak(u);
  }, [arrancarReconocimiento]);

  const buscarProducto = (texto) => {
    const t = expandirSinonimos(normalizar(texto));
    return dataRef.current.productos.find((p) => {
      const nombre = normalizar(p.nombre);
      if (t.includes(nombre)) return true;
      return nombre.split(' ').some((w) => w.length > 2 && t.includes(w));
    });
  };

  /*
   * El plan B: preguntarle a la IA qué quiso decir.
   *
   * Mientras piensa, el micrófono queda apagado a propósito: si siguiera
   * escuchando, cualquier "¿aló?" del cliente entraría como una frase nueva y
   * se le encimarían dos respuestas. Se enciende de nuevo al hablar.
   */
  const preguntarALaIA = useCallback(async (frase) => {
    const { productos, carrito } = dataRef.current;
    const fns = fnRef.current;

    setPensando(true);
    try {
      const idea = await aiService.entenderPedido({
        frase,
        productos: productos.map((p) => ({ nombre: p.nombre, precio: p.precio })),
        carrito: carrito.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
      });

      // La IA no pudo: se responde igual que cuando no existía.
      if (!idea?.entendido) {
        hablarRef.current?.('No encontré ese producto. ¿Puede repetirlo?');
        return;
      }

      /*
       * La acción se ejecuta con las MISMAS funciones del carrito que usan
       * las reglas. La IA decide qué hacer; quien lo hace sigue siendo el
       * código de siempre, que ya sabe de precios y de existencias.
       */
      const prod = idea.producto
        ? productos.find((p) => p.nombre === idea.producto)
        : null;

      if (idea.accion === 'agregar' && prod) {
        fns.agregarAlCarrito?.(prod, idea.cantidad || 1);
      } else if (idea.accion === 'quitar' && prod) {
        fns.eliminarDelCarrito?.(prod.id);
      } else if (idea.accion === 'vaciar') {
        fns.limpiarCarrito?.();
      }

      hablarRef.current?.(idea.respuesta);
    } finally {
      setPensando(false);
    }
  }, []);

  const procesar = useCallback((texto) => {
    const t = expandirSinonimos(normalizar(texto));
    const { carrito, totalCarrito, productos } = dataRef.current;
    const fns = fnRef.current;

    silencioRef.current = 0;
    registrar('user', texto);

    // ── Si estamos esperando confirmación de compra ──
    if (confirmandoRef.current) {
      if (/\b(si|sí|claro|confirmo|dale|correcto|comprar)\b/.test(t)) {
        confirmandoRef.current = false;
        // Quien cierra la compra es la tienda, no el asistente: aquí solo se
        // avisa que la persona dijo que sí.
        fns.alConfirmarCompra?.();
      } else if (/\b(no|cancela|espera|todavia|todavía|aun|aún)\b/.test(t)) {
        confirmandoRef.current = false;
        hablar('Ok, seguimos. ¿Qué más quieres agregar?');
      } else {
        hablar('¿Confirmas la compra? Di sí para confirmar, o no para seguir agregando.');
      }
      return;
    }

    if (/\b(ayuda|que puedo decir|comandos|no se|no entiendo)\b/.test(t)) {
      hablar('Puedes decir: quiero una manzana y dos galletas, quita una manzana, cuánto llevo, vaciar carrito, o comprar.');
      return;
    }
    if (/\b(repite|repetir|otra vez|que dijiste)\b/.test(t)) {
      hablar(ultimaRespuestaRef.current || 'No he dicho nada todavía.');
      return;
    }
    if (/\b(vaciar|vacia|vacía|limpiar|empezar de nuevo|borra todo)\b/.test(t)) {
      fns.limpiarCarrito?.();
      hablar('Vacié tu carrito. ¿Qué te gustaría llevar?');
      return;
    }
    // Comprar → pide confirmación (no compra de una).
    if (/\b(comprar|pagar|finalizar|listo|terminar|es todo)\b/.test(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      confirmandoRef.current = true;
      hablar(`Tu total es $${totalCarrito.toFixed(2)} con ${contarItems(carrito)} productos. ¿Confirmas la compra? Di sí para confirmar.`);
      return;
    }
    if (/\b(cuanto|total|llevo|va)\b/.test(t)) {
      hablar(`Llevas $${totalCarrito.toFixed(2)} en ${contarItems(carrito)} productos.`);
      return;
    }
    if (/\b(quita|quitar|elimina|eliminar|borra|saca|remueve)\b/.test(t)) {
      const prod = buscarProducto(t);
      if (!prod) { hablar('No encontré ese producto para quitarlo.'); return; }
      const enCarrito = carrito.find((i) => i.id === prod.id);
      if (!enCarrito) { hablar(`No tienes ${prod.nombre} en el carrito.`); return; }
      const c = cantidadExplicita(t);
      if (c === null || c >= enCarrito.cantidad) {
        fns.eliminarDelCarrito?.(prod.id);
        hablar(`Quité ${prod.nombre} del carrito.`);
      } else {
        fns.actualizarCantidad?.(prod.id, enCarrito.cantidad - c);
        hablar(`Quité ${c} ${prod.nombre}. Te quedan ${enCarrito.cantidad - c}.`);
      }
      return;
    }

    /*
     * ── Llevarlo a donde pidió ──
     *
     * Va ANTES de agregar al carrito y eso es la clave: "quiero una manzana"
     * la mete al carrito, pero "quiero VER las manzanas" lo lleva al
     * producto. La diferencia entera está en el verbo, así que si la frase
     * pide ver algo, no se toca el carrito.
     *
     * Sirve sobre todo con el asistente en segundo plano: se sigue navegando
     * la tienda con la voz mientras se mira la pantalla.
     */
    if (PIDE_IR.test(t)) {
      // 1. ¿Una sección de su cuenta?
      const destino = DESTINOS_CUENTA.find((d) => d.palabras.test(t));
      if (destino && fns.irARuta) {
        fns.irARuta(destino.ruta);
        hablar(`Le abro ${destino.nombre}.`);
        return;
      }

      // 2. ¿Un producto? Es lo más específico, así que gana sobre la categoría.
      const prod = buscarProducto(t);
      if (prod && fns.irAProducto) {
        fns.irAProducto(prod);
        hablar(`Aquí está ${prod.nombre}, a $${Number(prod.precio).toFixed(2)}.`);
        return;
      }

      // 3. ¿Una categoría o pasillo?
      const cat = (dataRef.current.categorias || []).find((c) => {
        const n = normalizar(String(c));
        return n.length > 2 && t.includes(n);
      });
      if (cat && fns.irACategoria) {
        fns.irACategoria(cat);
        hablar(`Le muestro ${cat}.`);
        return;
      }

      // Pidió ver algo que no se encontró: que lo descifre la IA, que para
      // eso está — quizá pidió "lo de la limpieza" y hay una categoría así.
      preguntarALaIA(texto);
      return;
    }

    // ── Agregar (varios por frase) ──
    const partes = t.split(/\s+y\s+|,|\s+tambien\s+|\s+ademas\s+/).map((s) => s.trim()).filter(Boolean);
    const agregados = [];
    const vistos = new Set();
    for (const parte of partes) {
      const prod = buscarProducto(parte);
      if (prod && !vistos.has(prod.id)) {
        const cant = cantidadExplicita(parte) ?? 1;
        fns.agregarAlCarrito?.(prod, cant);
        agregados.push(`${cant} ${prod.nombre}`);
        vistos.add(prod.id);
      }
    }

    if (agregados.length === 0) {
      /*
       * Aquí las reglas se dieron por vencidas. Antes se acababa la
       * conversación con un "no encontré ese producto"; ahora se le pregunta
       * a la IA qué quiso decir.
       *
       * El orden importa: primero reglas (instantáneo, gratis, sin internet)
       * y la IA solo para lo que no entienden. Si la IA tampoco puede —sin
       * llave, sin cuota, sin señal— se responde igual que antes, así que
       * nunca queda peor que como estaba.
       */
      preguntarALaIA(texto);
      return;
    }

    let mensaje = agregados.length === 1
      ? `Agregué ${agregados[0]}. ¿Algo más?`
      : `Agregué ${agregados.slice(0, -1).join(', ')} y ${agregados[agregados.length - 1]}. ¿Algo más?`;

    // Upsell (una sola vez): sugiere un producto en oferta que no esté en el carrito.
    if (!sugeridoRef.current) {
      const promo = productos.find((p) =>
        p.esMasVendido && p.precioAnterior > p.precio &&
        !vistos.has(p.id) && !carrito.some((i) => i.id === p.id));
      if (promo) {
        sugeridoRef.current = true;
        mensaje += ` Por cierto, ${promo.nombre} está en oferta hoy.`;
      }
    }

    hablar(mensaje);
  }, [hablar, preguntarALaIA]);

  procesarRef.current = procesar;
  hablarRef.current = hablar;

  const iniciar = useCallback(() => {
    if (!soportado) { hablar('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'); return; }
    activoRef.current = true;
    setActivo(true);
    arrancarReconocimiento();
  }, [soportado, hablar, arrancarReconocimiento]);

  /*
   * Interrumpir al asistente. Se corta lo que está diciendo y se pone a
   * escuchar de una vez.
   *
   * Es de las cosas que más se agradecen: el asistente termina con "¿algo
   * más?" y uno ya sabe qué quiere, pero tenía que aguantarse la frase
   * completa antes de poder hablar. Una persona de verdad se deja
   * interrumpir; esto es lo mismo.
   */
  const interrumpir = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    hablandoRef.current = false;
    setHablando(false);
    activoRef.current = true;
    setActivo(true);
    arrancarReconocimiento();
  }, [arrancarReconocimiento]);

  const detener = useCallback(() => {
    activoRef.current = false;
    setActivo(false);
    setEscuchando(false);
    recognitionRef.current?.stop();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const toggleMute = useCallback(() => {
    setMuteado((m) => !m);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const cambiarVelocidad = useCallback(() => {
    setVelIndex((i) => (i + 1) % VELOCIDADES.length);
  }, []);

  // Al desmontar (cerrar el asistente): apagar TODO para que no siga escuchando
  // ni hablando en segundo plano.
  useEffect(() => {
    return () => {
      const teniaSesion = activoRef.current;
      activoRef.current = false;
      recognitionRef.current?.stop();
      if (teniaSesion && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /*
   * Cambiar de voz. Se prueba en el momento con una frase corta: elegir a
   * ciegas de una lista de nombres —"Sabina", "Helena", "Jorge"— no le dice
   * nada a nadie hasta que la escucha.
   */
  const cambiarVoz = useCallback((nombre) => {
    setVozElegida(nombre);
    vozRef.current = nombre;
    try { localStorage.setItem(LLAVE_VOZ, nombre); } catch { /* modo privado */ }

    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voz = leerVocesDelSistema().find((v) => v.name === nombre);
    if (!voz) return;

    window.speechSynthesis.cancel();
    const prueba = new SpeechSynthesisUtterance('Hola, así sueno. ¿Qué le doy?');
    prueba.voice = voz;
    prueba.lang = voz.lang;
    prueba.rate = rateRef.current;
    window.speechSynthesis.speak(prueba);
  }, []);

  /*
   * La lista para la pantalla, ya lista para pintar. Si el sistema no tiene
   * ninguna voz en español, esto viene vacío y la pantalla no muestra el
   * selector: mejor eso que ofrecer una lista de voces en inglés.
   */
  const voces = vocesDelSistema.map((v) => ({
    nombre: v.name,
    etiqueta: nombreBonito(v),
    pais: paisDeVoz(v),
  }));

  // Cuál está sonando: la guardada, o la primera si esa ya no existe.
  const vozActual = voces.find((v) => v.nombre === vozElegida)?.nombre || voces[0]?.nombre || '';

  return {
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    velLabel: VELOCIDADES[velIndex].label,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, soportado, interrumpir,
    voces, vozActual, cambiarVoz,
  };
};
