import { useRef, useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { aiService } from '../api/aiService';
import { decirConTiqui, callarTiqui, paraDecir } from '../utils/vozTiqui';

/*
 * useVoiceAssistant — el "cerebro" de Tiqui, el asistente por voz (Modo Kiosco).
 *
 * Funciones:
 *   - Escucha continua (manos libres) + transcripción en vivo.
 *   - Habla con la VOZ DE TIQUI (la del video, desde el servidor) y, si no
 *     está disponible, con la del sistema. Barge-in, MUTE y VELOCIDAD.
 *   - Reglas rápidas con SINÓNIMOS y VARIOS productos por frase para lo
 *     común; lo demás (ofertas, recomendaciones, preguntas) lo resuelve la IA.
 *   - No dice el total al agregar (solo cuando lo piden).
 *   - CONFIRMA antes de comprar ("¿seguro? di sí").
 *   - UPSELL: sugiere un producto en oferta (una vez).
 *   - RE-PREGUNTA si hay silencio.
 *   - Guarda el HISTORIAL de la conversación (para el chat en pantalla).
 *
 * Tiqui habla en primera persona y TUTEA, como en su video: nada de "usted".
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

/*
 * Si la persona no eligió ninguna, una latinoamericana antes que una de
 * España: la primera de la lista en Windows suele ser Helena (es-ES), que
 * suena lejos de la tienda y de la voz de Tiqui.
 */
const ACENTOS_PREFERIDOS = ['es-SV', 'es-MX', 'es-US', 'es-419', 'es-GT', 'es-CO'];
const vozPreferida = (lista) =>
  ACENTOS_PREFERIDOS.map((l) => lista.find((v) => v.lang === l)).find(Boolean) || lista[0];

const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => sinAcentos(s).toLowerCase().trim();
const contarItems = (lista) => lista.reduce((a, i) => a + i.cantidad, 0);

/*
 * Las frases del total. El monto se escribe "$12.50" (así sale en el chat) y
 * la voz lo dice "12 dólares con 50 centavos" (ver paraDecir en vozTiqui).
 * Decía "Tu total es $12.50 con 3 productos": dicho en voz alta quedaba
 * "...con 50 centavos con 3 productos", y con uno solo, "1 productos".
 */
const productosEnTexto = (lista) => {
  const n = contarItems(lista);
  return n === 1 ? '1 producto' : `${n} productos`;
};
const fraseConfirmar = (lista, total) =>
  `Son ${productosEnTexto(lista)} y tu total es $${total.toFixed(2)}. ¿Confirmas la compra? Di sí para confirmar.`;
const fraseLlevas = (lista, total) => `Llevas $${total.toFixed(2)} en ${productosEnTexto(lista)}.`;

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
 * Lo que la persona pidió en un pedazo de la frase, sin las palabras de pedir
 * ni la cantidad: de "dos galletas" queda "galletas".
 *
 * Con "quiero una manzana y dos galletas", y sin galletas en la tienda, se
 * agregaba la manzana y las galletas se callaban: "Agregué 1 Manzana. ¿Algo
 * más?", como si se hubiera hecho todo. Ahora se dice lo que no hay.
 */
const DE_RELLENO = new Set([
  'quiero', 'quisiera', 'dame', 'deme', 'agrega', 'agregame', 'agregue', 'pon', 'ponme',
  'echa', 'echame', 'das', 'llevo', 'anota', 'anotame', 'necesito', 'los', 'las', 'del',
  'por', 'favor', 'porfa', 'mas', 'con', 'para', 'libra', 'libras', 'media', 'medio',
  'poquito', 'eso', 'todo', 'nada', 'bueno', 'gracias', 'hoy', 'solo', 'nomas', 'algo',
  'otra', 'otro', 'cosa', ...Object.keys(NUMEROS),
]);
const loQuePidio = (parte) =>
  parte.split(/\s+/).filter((w) => w.length > 2 && !DE_RELLENO.has(w) && !/\d/.test(w)).join(' ');

// Las partes de una frase con varios pedidos: "una manzana y dos galletas".
const SEPARA_PEDIDOS = /\s+y\s+|,|\s+tambien\s+|\s+ademas\s+/;

/*
 * ============================================================
 * LLEVARLO A DONDE PIDIÓ
 * ============================================================
 * Las secciones de la cuenta a las que se puede ir hablando. La clave son las
 * palabras que la gente usa de verdad, no el nombre del menú: nadie dice
 * "llévame a Puntos de fidelidad", dice "cuántos puntos llevo".
 */
const DESTINOS_CUENTA = [
  { seccion: 'pedidos',     ruta: '/mi-cuenta/pedidos',        palabras: /\b(mis pedidos|mi pedido|pedidos|ordenes|compras)\b/, nombre: 'tus pedidos' },
  { seccion: 'puntos',      ruta: '/mi-cuenta/puntos',         palabras: /\b(puntos|fidelidad|premios)\b/,                      nombre: 'tus puntos' },
  { seccion: 'favoritos',   ruta: '/mi-cuenta/favoritos',      palabras: /\b(favoritos|guardados|me gusta)\b/,                  nombre: 'tus favoritos' },
  { seccion: 'direcciones', ruta: '/mi-cuenta/direcciones',    palabras: /\b(direcciones|direccion|donde vivo)\b/,              nombre: 'tus direcciones' },
  { seccion: 'pagos',       ruta: '/mi-cuenta/pagos',          palabras: /\b(pagos|tarjetas|saldo|metodos de pago)\b/,          nombre: 'tus métodos de pago' },
  { seccion: 'recibos',     ruta: '/mi-cuenta/recibidos',      palabras: /\b(recibos|facturas|comprobantes)\b/,                 nombre: 'tus recibos' },
  { seccion: 'avisos',      ruta: '/mi-cuenta/notificaciones', palabras: /\b(notificaciones|avisos|alertas)\b/,                 nombre: 'tus avisos' },
  { seccion: 'cuenta',      ruta: '/mi-cuenta',                palabras: /\b(mi cuenta|mis datos|mi perfil)\b/,                 nombre: 'tu cuenta' },
];

// Cómo pide la gente que la lleven a algún lado.
const PIDE_IR = /\b(ver|vamos|llevame|llévame|muestrame|muéstrame|enseñame|enséñame|abrir|abre|quiero ver|busca|buscar|donde esta|dónde está|ir a)\b/;

/*
 * Vaciar el carrito. Antes solo entendía "vaciar" o "borra todo": "borra el
 * carrito" caía en la regla de QUITAR un producto, buscaba uno llamado "el
 * carrito" y contestaba "no encontré ese producto".
 */
const PIDE_VACIAR = /\b(vaciar|vacia|vacialo|empezar de nuevo|borra todo|borrar todo|quita todo|quitar todo)\b|\b(borra|borrar|limpia|limpiar|quita|quitar|elimina|eliminar|saca|sacar|vacia|vaciar)\s+(todo\s+)?(el|mi)\s+carrito\b/;

/*
 * Cuánto lleva. Antes bastaba la palabra suelta "va", y "¿cómo va mi pedido?"
 * contestaba el total del carrito.
 */
const PIDE_TOTAL = /\b(cuanto llevo|cuanto va|cuanto debo|cuanto sale todo|el total|mi total|total)\b|^cuanto (es|seria)( todo)?$/;

/*
 * Una pregunta, no un pedido: precios, ofertas, recomendaciones, si hay algo.
 * Lo que la regla de agregar NO debe tocar (ver "Preguntas" en procesar).
 */
const ES_PREGUNTA = /\b(que|cual|cuales|cuanto cuesta|cuanto vale|cuanto sale|precio|hay|tienen|tienes|esta en|estan en|recomienda|recomiendas|recomiendame|sugiere|sugieres|oferta|ofertas|promo|promocion|promociones|descuento|descuentos|donde|como|por que)\b/;
// …salvo que en la misma frase pida algo: "quiero leche, ¿hay descuento?".
const PIDE_AGREGAR = /\b(quiero|dame|deme|agrega|agregame|agregue|pon|ponme|echa|echame|me das|me llevo|llevo|anota|anotame)\b/;

// Las secciones que la IA puede pedir abrir (ver HERRAMIENTAS_TIQUI en el backend).
const RUTA_DE_SECCION = Object.fromEntries(DESTINOS_CUENTA.map((d) => [d.seccion, d]));

/*
 * Terminar la compra. "Listo" solo cuenta si es casi todo lo que dijo: en
 * "¿ya está listo mi pedido?" no quiere pagar.
 */
const PIDE_COMPRAR = (t) =>
  /\b(comprar|pagar|finalizar|terminar|es todo|eso es todo)\b/.test(t) ||
  (/^(ya\s+)?listo\b/.test(t) && t.split(' ').length <= 3);

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
  /*
   * La voz de Tiqui: `vozTiqui` si el servidor la tiene (hay llave de
   * ElevenLabs), `sonandoTiqui` mientras suena de verdad — la mascota mueve
   * la boca con el volumen del audio en vez de la animación en bucle.
   */
  const [vozTiqui, setVozTiqui] = useState(false);
  const [sonandoTiqui, setSonandoTiqui] = useState(false);

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
  const vozTiquiRef = useRef(false);
  // Fallas seguidas de la voz de Tiqui: con dos, se deja de intentar en esta
  // charla para no hacer esperar cuatro segundos cada vez.
  const fallasVozRef = useRef(0);
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null);
  const hablarRef = useRef(null);
  const confirmandoRef = useRef(false); // esperando "sí" para comprar
  const silencioRef = useRef(0);
  const ultimoSiguesRef = useRef(0);    // cuándo preguntó "¿sigue ahí?" por última vez
  const sugeridoRef = useRef(false);     // ya hicimos upsell esta sesión
  const idRef = useRef(0);
  /*
   * La memoria de la charla, al día en el mismo instante: el estado
   * `historial` se actualiza en el próximo render, y la pregunta a la IA sale
   * antes. Es lo que viaja con cada pregunta para que entienda un "sí" o un
   * "mejor dos" que dependen de lo anterior.
   */
  const memoriaRef = useRef([]);

  const soportado =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Agrega un mensaje al historial (limita a los últimos 8).
  const registrar = (tipo, texto) => {
    memoriaRef.current = [...memoriaRef.current.slice(-7), { tipo, texto }];
    setHistorial((h) => [...h.slice(-7), { id: idRef.current++, tipo, texto }]);
  };

  /*
   * Al abrir: despierta el servidor (Render lo duerme) y pregunta si tiene la
   * voz de Tiqui. Mientras no conteste, se habla con la del sistema.
   */
  useEffect(() => {
    let vivo = true;
    aiService.despertar().then(({ voz }) => {
      if (!vivo) return;
      vozTiquiRef.current = voz;
      setVozTiqui(voz);
    });
    return () => { vivo = false; };
  }, []);

  // Calla cualquier voz: la de Tiqui y la del sistema.
  const callarTodo = () => {
    callarTiqui();
    setSonandoTiqui(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const arrancarReconocimiento = useCallback(() => {
    if (!soportado || !activoRef.current) return;
    callarTodo();
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

  /*
   * La voz del sistema: la que tenga el navegador en español. Es el respaldo
   * de la de Tiqui, y la única si el servidor no la tiene.
   */
  const decirConElSistema = (texto, continuar) => {
    if (!window.speechSynthesis) {
      continuar();
      return;
    }
    window.speechSynthesis.cancel();
    // "$12.50" se dice "12 dólares con 50 centavos", no "doce pesos". Ver paraDecir.
    const u = new SpeechSynthesisUtterance(paraDecir(texto));
    u.lang = 'es-SV';
    u.rate = rateRef.current;
    /*
     * La voz que eligió la persona; si esa ya no está (cambió de computadora,
     * la desinstalaron), se cae a una latinoamericana (suena más cerca de la
     * de Tiqui) o a la primera en español, en vez de quedarse muda o hablar
     * en inglés.
     */
    const enEspanol = leerVocesDelSistema();
    const elegida = enEspanol.find((v) => v.name === vozRef.current);
    const voz = elegida || vozPreferida(enEspanol);
    if (voz) {
      u.voice = voz;
      // El idioma tiene que ir con la voz: dejar es-SV con una voz de España
      // hace que algunos navegadores la ignoren y hablen en inglés.
      u.lang = voz.lang;
    }
    u.onend = continuar;
    u.onerror = continuar;
    window.speechSynthesis.speak(u);
  };

  const hablar = useCallback((texto) => {
    ultimaRespuestaRef.current = texto;
    registrar('bot', texto);

    const continuar = () => {
      hablandoRef.current = false;
      setHablando(false);
      if (activoRef.current) setTimeout(() => arrancarReconocimiento(), 350);
    };

    if (muteRef.current || typeof window === 'undefined') {
      continuar();
      return;
    }

    callarTodo();
    hablandoRef.current = true;
    setHablando(true);

    // Con la voz de Tiqui, si el servidor la tiene. Si no arranca, la del sistema.
    if (vozTiquiRef.current) {
      decirConTiqui(aiService.urlVoz(texto), {
        // 0,95 es la velocidad "Normal" de la voz del sistema; el audio va a 1.
        velocidad: rateRef.current / 0.95,
        alEmpezar: () => setSonandoTiqui(true),
        alTerminar: () => {
          fallasVozRef.current = 0;
          setSonandoTiqui(false);
          continuar();
        },
        alFallar: () => {
          setSonandoTiqui(false);
          fallasVozRef.current += 1;
          if (fallasVozRef.current >= 2) {
            vozTiquiRef.current = false;
            setVozTiqui(false);
          }
          decirConElSistema(texto, continuar);
        },
      });
      return;
    }

    decirConElSistema(texto, continuar);
  }, [arrancarReconocimiento]);

  /*
   * Cuánto se parece lo que dijo la persona al nombre de ESTE producto.
   *
   * Antes esto era un .find() que se quedaba con el PRIMER producto que
   * cumpliera cualquier coincidencia, sin comparar contra los demás. Con
   * "fresa", la fruta ("Fresas") nunca calificaba —el chequeo pedía que lo
   * dicho CONTUVIERA el nombre completo, y "fresa" es más corto que
   * "fresas", así que nunca lo contiene— pero "Jarritos de fresa" sí
   * colaba, porque una de sus palabras ("fresa") aparecía adentro de lo
   * dicho. Ganaba lo que sonaba parecido en cualquier rincón del nombre,
   * no lo que la persona de verdad pidió.
   *
   * Ahora se puntúa y se compara contra TODOS los productos, de más a menos
   * exacto:
   *   100 — dijo el nombre completo, tal cual.
   *    90 — el nombre completo aparece dentro de lo que dijo
   *         ("quiero ver las fresas" trae "fresas" adentro).
   *    80 — lo que dijo es la palabra que manda en el nombre, en singular
   *         o en plural ("fresa" ~ "Fresas": la fruta se llama por su
   *         primera palabra, y ahí es donde importa el singular/plural).
   *    70 — esa palabra aparece COMPLETA en una frase más larga
   *         ("una fresa por favor" trae la palabra "fresa" suelta).
   *    20 — alguna palabra del nombre aparece en cualquier lado, aunque no
   *         sea la que manda. Es el único nivel que hacía colar a
   *         "Jarritos de fresa" antes, y ahora es el más débil de todos:
   *         pierde contra la fruta en el nivel 80.
   */
  const puntuarCoincidencia = (nombreProducto, t) => {
    const nombre = normalizar(nombreProducto);
    const palabras = nombre.split(' ').filter((w) => w.length > 2);
    const principal = palabras[0] || nombre;
    // Quita una "s" del final para comparar singular con plural sin
    // depender de un diccionario: alcanza para "fresa"/"fresas",
    // "galleta"/"galletas", que es como la gente pide en la tienda.
    const singular = (s) => s.replace(/s$/, '');

    if (t === nombre) return 100;
    if (t.includes(nombre)) return 90;
    if (singular(t) === singular(principal)) return 80;
    if (
      new RegExp(`\\b${principal}\\b`).test(t) ||
      new RegExp(`\\b${singular(principal)}\\b`).test(t)
    ) return 70;
    if (palabras.some((w) => t.includes(w))) return 20;
    return 0;
  };

  const buscarProducto = (texto) => {
    const t = expandirSinonimos(normalizar(texto));
    let mejor = null;
    let mejorPuntaje = 0;
    for (const p of dataRef.current.productos) {
      const puntaje = puntuarCoincidencia(p.nombre, t);
      if (puntaje > mejorPuntaje) {
        mejor = p;
        mejorPuntaje = puntaje;
      }
    }
    return mejor;
  };

  /*
   * Lo que no entienden las reglas rápidas se lo pregunta a Tiqui (la IA).
   *
   * El servidor ya decidió qué hacer: devuelve una LISTA de acciones (puede
   * traer varias: "dos manzanas y una leche") y la frase que hay que decir.
   * Aquí solo se ejecutan, con las MISMAS funciones del carrito que usan las
   * reglas: la IA decide, pero quien toca el carrito sigue siendo el código
   * de siempre, que ya sabe de precios y de existencias.
   *
   * Mientras piensa, el micrófono queda apagado a propósito: si siguiera
   * escuchando, cualquier "¿aló?" del cliente entraría como una frase nueva y
   * se le encimarían dos respuestas. Se enciende de nuevo al hablar.
   */
  const preguntarALaIA = useCallback(async (frase) => {
    const fns = fnRef.current;

    setPensando(true);
    try {
      const idea = await aiService.asistente({
        frase,
        // Solo se usan si el servidor todavía es el viejo (ver aiService).
        productos: dataRef.current.productos,
        carrito: dataRef.current.carrito.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
        /*
         * Lo que se habló ANTES de esta frase (la última de la memoria es la
         * frase misma, que ya va aparte). Con esto la IA sabe a qué se
         * refiere un "sí" o un "mejor dos".
         */
        historial: memoriaRef.current.slice(0, -1).slice(-6).map((m) => ({
          quien: m.tipo === 'user' ? 'cliente' : 'asistente',
          texto: m.texto,
        })),
      });

      // No hubo red o el servidor no contestó a tiempo: decirlo tal cual,
      // no fingir que no se entendió lo que se dijo bien.
      if (idea?.origen === 'sin-red') {
        hablarRef.current?.('Perdón, se me cortó la conexión. ¿Me lo repites?');
        return;
      }

      // La IA está saturada o no contestó a tiempo: no es que no se haya
      // entendido, así que se pide de nuevo sin hacerlo sentir culpable.
      if (idea?.origen === 'error') {
        hablarRef.current?.('Uy, me distraje un segundo. ¿Me lo repites?');
        return;
      }

      /*
       * De verdad no se entendió. Es el respaldo de última línea —ni las
       * reglas ni la IA sacaron nada—, así que queda neutro: no inventa que
       * buscó un producto que nunca se pidió, y dice qué sí sabe hacer.
       */
      if (!idea?.entendido) {
        hablarRef.current?.('No te entendí bien. Puedo agregarte productos, contarte las ofertas o llevarte a una sección de la tienda.');
        return;
      }

      const { productos, carrito } = dataRef.current;
      let pideTotal = false;
      let pideComprar = false;

      for (const accion of Array.isArray(idea.acciones) ? idea.acciones : []) {
        const prod = accion.producto ? productos.find((p) => p.nombre === accion.producto) : null;

        switch (accion.tipo) {
          case 'agregar':
            if (prod) fns.agregarAlCarrito?.(prod, accion.cantidad || 1);
            break;
          case 'quitar': {
            const enCarrito = prod && carrito.find((i) => i.id === prod.id);
            if (!enCarrito) break;
            if (accion.cantidad && accion.cantidad < enCarrito.cantidad) {
              fns.actualizarCantidad?.(prod.id, enCarrito.cantidad - accion.cantidad);
            } else {
              fns.eliminarDelCarrito?.(prod.id);
            }
            break;
          }
          case 'cambiar': {
            // "Mejor que sean dos": deja la cantidad exacta. Si todavía no
            // estaba en el carrito, se agrega con esa cantidad.
            if (!prod) break;
            if (carrito.some((i) => i.id === prod.id)) fns.actualizarCantidad?.(prod.id, accion.cantidad || 1);
            else fns.agregarAlCarrito?.(prod, accion.cantidad || 1);
            break;
          }
          case 'vaciar':
            fns.limpiarCarrito?.();
            break;
          case 'mostrar':
            if (prod) fns.irAProducto?.(prod);
            break;
          case 'categoria': {
            const buscada = normalizar(accion.categoria);
            const cat = (dataRef.current.categorias || []).find((c) => normalizar(String(c)) === buscada);
            if (cat) fns.irACategoria?.(cat);
            break;
          }
          case 'seccion': {
            const destino = RUTA_DE_SECCION[accion.seccion];
            if (destino) fns.irARuta?.(destino.ruta);
            break;
          }
          case 'total':
            pideTotal = true;
            break;
          case 'comprar':
            pideComprar = true;
            break;
          default:
            break;
        }
      }

      /*
       * El monto en dólares NUNCA sale de lo que dijo la IA: se arma aquí con
       * `totalCarrito`, que es la cuenta exacta de la tienda. Pedirle
       * aritmética de dinero a un modelo de lenguaje es invitarlo a redondear
       * mal.
       *
       * Se espera un instante: agregar y quitar actualizan el carrito en el
       * próximo render, y "dos manzanas y cuánto llevo" en la misma frase
       * tiene que decir el total CON las manzanas.
       */
      setTimeout(() => {
        const { carrito: ahora, totalCarrito } = dataRef.current;
        let dice = idea.respuesta;
        if (pideComprar) {
          if (!ahora.length) {
            dice = 'Tu carrito está vacío. ¿Qué te gustaría llevar?';
          } else {
            confirmandoRef.current = true;
            dice = fraseConfirmar(ahora, totalCarrito);
          }
        } else if (pideTotal) {
          dice = fraseLlevas(ahora, totalCarrito);
        }
        hablarRef.current?.(dice);
      }, 0);
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
      hablar('Puedes decirme: quiero una manzana y dos galletas, qué ofertas hay, quita una manzana, cuánto llevo, borra el carrito o comprar.');
      return;
    }
    if (/\b(repite|repetir|otra vez|que dijiste)\b/.test(t)) {
      hablar(ultimaRespuestaRef.current || 'No he dicho nada todavía.');
      return;
    }
    if (PIDE_VACIAR.test(t)) {
      fns.limpiarCarrito?.();
      hablar('Vacié tu carrito. ¿Qué te gustaría llevar?');
      return;
    }
    // Comprar → pide confirmación (no compra de una).
    if (PIDE_COMPRAR(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      confirmandoRef.current = true;
      hablar(fraseConfirmar(carrito, totalCarrito));
      return;
    }
    if (PIDE_TOTAL.test(t)) {
      hablar(fraseLlevas(carrito, totalCarrito));
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
        hablar(`Te abro ${destino.nombre}.`);
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
        hablar(`Te muestro ${cat}.`);
        return;
      }

      // Pidió ver algo que no se encontró: que lo descifre la IA, que para
      // eso está — quizá pidió "lo de la limpieza" y hay una categoría así.
      preguntarALaIA(texto);
      return;
    }

    /*
     * ── Preguntas: a Tiqui, nunca al carrito ──
     * "¿La leche está en oferta?" nombra un producto, y la regla de agregar
     * de abajo la metía al carrito. Si suena a pregunta y no pide nada, la
     * contesta la IA, que sabe de precios, ofertas y recomendaciones.
     */
    // Con signos de pregunta va a la IA aunque también pida algo: ella agrega Y contesta.
    const conSignos = /[¿?]/.test(texto);
    if ((conSignos || ES_PREGUNTA.test(t)) && (conSignos || !PIDE_AGREGAR.test(t))) {
      preguntarALaIA(texto);
      return;
    }

    // ── Agregar (varios por frase) ──
    const partes = t.split(SEPARA_PEDIDOS).map((s) => s.trim()).filter(Boolean);
    // Lo mismo sin los sinónimos que se le pegan al final: así se nombra lo
    // que no hay tal como lo dijo ("soda", no "soda refresco").
    const dichas = normalizar(texto).split(SEPARA_PEDIDOS).map((s) => s.trim()).filter(Boolean);
    const noHay = [];
    const agregados = [];
    /*
     * Lo que se pidió pero está agotado. Antes se "agregaba" igual: el
     * carrito lo rechazaba en silencio y el asistente decía "Agregué 1 leche"
     * sobre una leche que nunca entró. Ahora se dice que se acabó.
     */
    const agotados = [];
    const vistos = new Set();
    for (const [i, parte] of partes.entries()) {
      const prod = buscarProducto(parte);
      if (!prod) {
        const pedido = loQuePidio(dichas[i] || parte);
        if (pedido && !noHay.includes(pedido)) noHay.push(pedido);
        continue;
      }
      if (!vistos.has(prod.id)) {
        vistos.add(prod.id);
        if ((Number(prod.stock) || 0) <= 0) {
          agotados.push(prod.nombre);
          continue;
        }
        const cant = cantidadExplicita(parte) ?? 1;
        fns.agregarAlCarrito?.(prod, cant);
        agregados.push(`${cant} ${prod.nombre}`);
      }
    }

    const seAcabo = agotados.length
      ? `Hoy se nos ${agotados.length === 1 ? 'acabó' : 'acabaron'} ${agotados.join(' y ')}.`
      : '';
    const sinEso = noHay.length ? `No tengo ${noHay.join(' ni ')}.` : '';

    if (agregados.length === 0 && agotados.length) {
      hablar(`${[seAcabo, sinEso].filter(Boolean).join(' ')} ¿Te busco otra cosa?`);
      return;
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
      ? `Agregué ${agregados[0]}.`
      : `Agregué ${agregados.slice(0, -1).join(', ')} y ${agregados[agregados.length - 1]}.`;
    // Lo que se pidió y no hay se dice, no se calla. Ver loQuePidio.
    if (sinEso) mensaje += ` ${sinEso}`;
    mensaje += seAcabo ? ` ${seAcabo} ¿Algo más?` : ' ¿Algo más?';

    // Upsell (una sola vez): sugiere un producto en oferta que no esté en el carrito
    // (y que haya: ofrecer un agotado es invitar a pedir algo que no se puede).
    if (!sugeridoRef.current) {
      const promo = productos.find((p) =>
        p.esMasVendido && p.precioAnterior > p.precio && (Number(p.stock) || 0) > 0 &&
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
    callarTodo();
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
    callarTodo();
  }, []);

  const toggleMute = useCallback(() => {
    setMuteado((m) => !m);
    callarTodo();
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
      if (teniaSesion) {
        callarTiqui();
        if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
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
    const prueba = new SpeechSynthesisUtterance('¡Hola! Así sueno. ¿Qué te llevas hoy?');
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

  // Cuál está sonando: la guardada, o la preferida si esa ya no existe.
  const vozActual = voces.find((v) => v.nombre === vozElegida)?.nombre || vozPreferida(vocesDelSistema)?.name || '';

  return {
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    velLabel: VELOCIDADES[velIndex].label,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, soportado, interrumpir,
    voces, vozActual, cambiarVoz,
    // La voz de Tiqui: si el servidor la tiene, y si está sonando ahora.
    vozTiqui, sonandoTiqui,
  };
};
