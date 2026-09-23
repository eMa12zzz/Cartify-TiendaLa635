/*
 * ============================================================
 * useAsistenteVoz — el "cerebro" del asistente por voz, en móvil
 * ============================================================
 * El equivalente de `frontend/src/hooks/useVoiceAssistant.js`. Las reglas de
 * texto (sinónimos, cantidades, puntaje por producto) son una copia literal:
 * eso es JS puro, sin nada del navegador, y funciona igual en los dos lados.
 *
 * Lo que SÍ cambia es cómo se escucha y se habla:
 *   - Web: `SpeechRecognition` / `speechSynthesis`, del navegador.
 *   - Aquí: `expo-speech-recognition` (módulo nativo, TurboModule — el único
 *     que de verdad soporta la New Architecture; `@react-native-voice/voice`
 *     falla en silencio con ella) y `expo-speech` para hablar.
 *
 * Y habla con la VOZ DE TIQUI (la del video, desde el servidor) cuando la
 * compilación trae expo-audio y el servidor tiene la llave; si no, con la
 * del teléfono. Ver utils/vozTiqui.js. Tiqui tutea, como en su video.
 *
 * Lo que se dejó AFUERA a propósito, para que esto fuera un apartado y no
 * un mes de trabajo:
 *   - Elegir voz del sistema (aquí el teléfono elige la suya en español).
 *   - Llevar a una sección de la cuenta específica o abrir un producto en su
 *     ficha: móvil no tiene esas pantallas conectadas a una ruta global
 *     todavía (ver `Asistente.js`). Sí navega a los 4 apartados y al carrito.
 *   - El upsell ("por cierto, X está en oferta"): el catálogo mapeado de
 *     móvil no trae el campo `esMasVendido` que usaba esa regla.
 *
 * ── El plan B: Tiqui, el mismo cerebro que la web ──
 * `preguntarALaIA` (más abajo) es lo que entra cuando estas reglas de texto
 * no alcanzan: habla con `/ai/asistente` (tool calling de Gemini, con el
 * catálogo, las promociones y los datos de la tienda). Ver el comentario
 * grande de TIQUI en `aiController.js`.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { asistenteApi } from '../api/asistenteApi';
import { useAuth } from './useAuth';
import { useEdad } from '../context/EdadContext';
import { esSoloAdultos } from '../utils/unidades';
import { navegarA } from '../navigation/navigationRef';
import { decirConTiqui, callarTiqui, vozTiquiPosible } from '../utils/vozTiqui';

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

const SINONIMOS = {
  refresco: ['gaseosa', 'soda', 'cola', 'coca'],
  platano: ['banano', 'guineo'],
  galletas: ['galleta'],
  churritos: ['churros', 'churro'],
  yogurt: ['yogur'],
  manzana: ['mansana'],
};

const VELOCIDADES = [
  { v: 0.8, label: 'Lenta' },
  { v: 0.95, label: 'Normal' },
  { v: 1.15, label: 'Rápida' },
];

// Mismos tiempos que la web: paciente con el silencio, no repregunta a cada rato.
const SILENCIOS_ANTES_DE_PREGUNTAR = 3;
const SILENCIO_COOLDOWN_MS = 30000;
const REINTENTO_SILENCIO_MS = 900;

// A dónde puede llevar por voz. Solo lo que móvil de verdad tiene como ruta.
const DESTINOS = [
  { seccion: 'pedidos', palabras: /\b(mis pedidos|mi pedido|pedidos|ordenes|compras)\b/, nombre: 'tus pedidos', tab: 'pedidos', sesion: true },
  { seccion: 'cuenta', palabras: /\b(mi perfil|mi cuenta|mis datos)\b/, nombre: 'tu cuenta', tab: 'perfil', sesion: true },
  { seccion: 'carrito', palabras: /\b(mi carrito|el carrito|carrito)\b/, nombre: 'tu carrito', ruta: 'Carrito' },
  { seccion: 'inicio', palabras: /\b(inicio|la tienda|el catalogo|el catálogo)\b/, nombre: 'el inicio', tab: 'inicio' },
];

/*
 * Las secciones que la IA puede pedir abrir. Móvil no tiene pantallas propias
 * para puntos, favoritos, direcciones, etc.: viven dentro del perfil.
 */
const DESTINO_DE_SECCION = {
  ...Object.fromEntries(DESTINOS.map((d) => [d.seccion, d])),
  ...Object.fromEntries(['puntos', 'favoritos', 'direcciones', 'pagos', 'recibos', 'avisos']
    .map((s) => [s, { nombre: 'tu cuenta', tab: 'perfil', sesion: true }])),
};

// Mismas reglas que la web (ver useVoiceAssistant.js allá para el porqué de cada una).
const PIDE_VACIAR = /\b(vaciar|vacia|vacialo|empezar de nuevo|borra todo|borrar todo|quita todo|quitar todo)\b|\b(borra|borrar|limpia|limpiar|quita|quitar|elimina|eliminar|saca|sacar|vacia|vaciar)\s+(todo\s+)?(el|mi)\s+carrito\b/;
const PIDE_TOTAL = /\b(cuanto llevo|cuanto va|cuanto debo|cuanto sale todo|el total|mi total|total)\b|^cuanto (es|seria)( todo)?$/;
const PIDE_COMPRAR = (t) =>
  /\b(comprar|pagar|finalizar|terminar|es todo|eso es todo)\b/.test(t) ||
  (/^(ya\s+)?listo\b/.test(t) && t.split(' ').length <= 3);
const ES_PREGUNTA = /\b(que|cual|cuales|cuanto cuesta|cuanto vale|cuanto sale|precio|hay|tienen|tienes|esta en|estan en|recomienda|recomiendas|recomiendame|sugiere|sugieres|oferta|ofertas|promo|promocion|promociones|descuento|descuentos|donde|como|por que)\b/;
const PIDE_AGREGAR = /\b(quiero|dame|deme|agrega|agregame|agregue|pon|ponme|echa|echame|me das|me llevo|llevo|anota|anotame)\b/;
const PIDE_IR = /\b(ver|vamos|llevame|llévame|muestrame|muéstrame|enseñame|enséñame|abrir|abre|ir a|donde esta|dónde está)\b/;

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

const expandirSinonimos = (t) => {
  let out = t;
  for (const [canon, syns] of Object.entries(SINONIMOS)) {
    for (const s of syns) {
      if (new RegExp(`\\b${s}\\b`).test(out)) out += ' ' + canon;
    }
  }
  return out;
};

// Mismo puntaje que la web — ver el comentario original ahí para el porqué
// de cada nivel (100 nombre exacto, 90 lo contiene, 80 palabra principal en
// singular/plural, 70 esa palabra suelta en la frase, 20 cualquier palabra).
const puntuarCoincidencia = (nombreProducto, t) => {
  const nombre = normalizar(nombreProducto);
  const palabras = nombre.split(' ').filter((w) => w.length > 2);
  const principal = palabras[0] || nombre;
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

export const useAsistenteVoz = ({ productos = [], carrito = [], totalCarrito = 0, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito, mostrarProducto }) => {
  const { isAuthenticated } = useAuth();
  // El mismo candado +18 que la tarjeta y la ficha: sin esto, pedirlo por
  // voz era una puerta trasera que ni tocaba la foto tapada ni el DUI.
  const { mayorConfirmado } = useEdad();

  const [activo, setActivo] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [muteado, setMuteado] = useState(false);
  const [velIndex, setVelIndex] = useState(1); // Normal
  const [transcripcion, setTranscripcion] = useState('');
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [historial, setHistorial] = useState([]);

  const dataRef = useRef({ productos, carrito, totalCarrito });
  dataRef.current = { productos, carrito, totalCarrito };
  const fnRef = useRef({});
  fnRef.current = { agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito, mostrarProducto };

  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const muteRef = useRef(false); muteRef.current = muteado;
  const rateRef = useRef(0.95); rateRef.current = VELOCIDADES[velIndex].v;
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null);
  const hablarRef = useRef(null);
  const arrancarRef = useRef(null);
  const confirmandoRef = useRef(false);
  const silencioRef = useRef(0);
  const ultimoSiguesRef = useRef(0);
  const finalTextoRef = useRef('');
  const idRef = useRef(0);
  // La voz de Tiqui: si el servidor la tiene (y esta compilación trae
  // expo-audio). Con dos fallas seguidas se deja de intentar en esta charla.
  const vozTiquiRef = useRef(false);
  const fallasVozRef = useRef(0);

  /*
   * La memoria de la charla, al día en el mismo instante (el estado
   * `historial` recién se actualiza en el próximo render y la pregunta a la IA
   * sale antes). Viaja con cada pregunta para que entienda un "sí" o un
   * "mejor dos" que dependen de lo anterior.
   */
  const memoriaRef = useRef([]);

  const registrar = (tipo, texto) => {
    memoriaRef.current = [...memoriaRef.current.slice(-7), { tipo, texto }];
    setHistorial((h) => [...h.slice(-7), { id: idRef.current++, tipo, texto }]);
  };

  // Despierta el servidor apenas se abre el asistente (Render lo duerme si no
  // hay tráfico). Así la primera pregunta no tarda medio minuto.
  // De paso pregunta si tiene la voz de Tiqui.
  useEffect(() => {
    let vivo = true;
    asistenteApi.despertar().then(({ voz }) => {
      if (vivo) vozTiquiRef.current = voz && vozTiquiPosible;
    });
    return () => { vivo = false; };
  }, []);

  const arrancarReconocimiento = useCallback(() => {
    if (!activoRef.current) return;
    callarTiqui();
    Speech.stop();
    hablandoRef.current = false;
    finalTextoRef.current = '';
    setTranscripcion('');
    try {
      ExpoSpeechRecognitionModule.start({ lang: 'es-SV', interimResults: true, continuous: false });
    } catch {
      // Ya estaba escuchando, o el reconocedor no está disponible en este
      // teléfono; el evento "error" (si llega) se encarga de avisar.
    }
  }, []);
  arrancarRef.current = arrancarReconocimiento;

  const hablar = useCallback((texto) => {
    ultimaRespuestaRef.current = texto;
    registrar('bot', texto);

    const continuar = () => {
      hablandoRef.current = false;
      setHablando(false);
      if (activoRef.current) setTimeout(() => arrancarRef.current?.(), 350);
    };

    if (muteRef.current) {
      continuar();
      return;
    }

    callarTiqui();
    Speech.stop();
    hablandoRef.current = true;
    setHablando(true);

    // La voz del teléfono: el respaldo de la de Tiqui, y la única sin ella.
    const conElTelefono = () => Speech.speak(texto, {
      // "es-419" (español latinoamericano neutro) en vez de es-SV: no todos
      // los teléfonos traen una voz de El Salvador instalada, y esta es la
      // que con más frecuencia sí encuentra una voz decente del sistema.
      language: 'es-419',
      rate: rateRef.current,
      onDone: continuar,
      onStopped: continuar,
      onError: continuar,
    });

    if (!vozTiquiRef.current) {
      conElTelefono();
      return;
    }
    decirConTiqui(asistenteApi.urlVoz(texto), {
      // 0,95 es la velocidad "Normal" de la voz del teléfono; el audio va a 1.
      velocidad: rateRef.current / 0.95,
      alTerminar: () => {
        fallasVozRef.current = 0;
        continuar();
      },
      alFallar: () => {
        fallasVozRef.current += 1;
        if (fallasVozRef.current >= 2) vozTiquiRef.current = false;
        conElTelefono();
      },
    });
  }, []);
  hablarRef.current = hablar;

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
   * El backend (`/ai/asistente`) ya hizo el tool calling: esto
   * solo EJECUTA la lista de acciones que Gemini decidió, una por una, igual
   * que las reglas locales de más abajo ejecutan lo que entendieron por
   * regex. Puede traer varias en un mismo turno ("dos manzanas y una
   * leche" son dos `agregar` en la misma respuesta) — por eso hacía falta
   * tool calling y no el `responseSchema` de un solo campo que usa la web.
   *
   * El monto en dólares de "total"/"comprar" NUNCA sale de lo que dijo la
   * IA: se arma acá con `totalCarrito`, que es la cuenta exacta de la
   * tienda. Pedirle aritmética de dinero a un modelo de lenguaje es
   * invitarlo a redondear mal.
   */
  const preguntarALaIA = useCallback(async (frase) => {
    const { productos } = dataRef.current;
    const fns = fnRef.current;

    setPensando(true);
    try {
      const idea = await asistenteApi.asistente({
        frase,
        carrito: dataRef.current.carrito.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
        // Lo que se habló ANTES de esta frase (la última de la memoria es la
        // frase misma, que ya va aparte).
        historial: memoriaRef.current.slice(0, -1).slice(-6).map((m) => ({
          quien: m.tipo === 'user' ? 'cliente' : 'asistente',
          texto: m.texto,
        })),
      });

      // Sin red o el servidor no contestó a tiempo: decirlo tal cual, no
      // fingir que no se entendió algo que se dijo bien.
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

      if (!idea?.entendido) {
        hablarRef.current?.('No te entendí bien. Puedo agregarte productos, contarte las ofertas o vaciar el carrito.');
        return;
      }

      const acciones = Array.isArray(idea.acciones) ? idea.acciones : [];
      const bloqueados = [];
      let pideTotal = false;
      let pideComprar = false;

      for (const accion of acciones) {
        const prod = accion.producto ? productos.find((p) => p.nombre === accion.producto) : null;

        switch (accion.tipo) {
          case 'agregar': {
            if (!prod) break;
            // Mismo candado +18 que la tarjeta, la ficha y las reglas
            // locales: la IA no lo mete al carrito por su cuenta.
            if (esSoloAdultos(prod) && !mayorConfirmado) {
              bloqueados.push(prod.nombre);
              break;
            }
            fns.agregarAlCarrito?.(prod, accion.cantidad || 1);
            break;
          }
          case 'quitar': {
            if (!prod) break;
            const enCarrito = dataRef.current.carrito.find((i) => i.id === prod.id);
            if (!enCarrito) break;
            if (accion.cantidad && accion.cantidad < enCarrito.cantidad) {
              fns.actualizarCantidad?.(prod.id, enCarrito.cantidad - accion.cantidad);
            } else {
              fns.eliminarDelCarrito?.(prod.id);
            }
            break;
          }
          case 'cambiar': {
            // "Mejor que sean dos": deja la cantidad exacta; si no estaba
            // en el carrito, se agrega con esa cantidad (con el mismo candado +18).
            if (!prod) break;
            const yaEsta = dataRef.current.carrito.find((i) => i.id === prod.id);
            if (yaEsta) {
              fns.actualizarCantidad?.(prod.id, accion.cantidad || 1);
            } else if (esSoloAdultos(prod) && !mayorConfirmado) {
              bloqueados.push(prod.nombre);
            } else {
              fns.agregarAlCarrito?.(prod, accion.cantidad || 1);
            }
            break;
          }
          case 'mostrar':
            if (prod) fns.mostrarProducto?.(prod);
            break;
          case 'vaciar':
            fns.limpiarCarrito?.();
            break;
          case 'seccion': {
            const destino = DESTINO_DE_SECCION[accion.seccion];
            if (!destino || (destino.sesion && !isAuthenticated)) break;
            if (destino.ruta) navegarA(destino.ruta);
            else navegarA('Tabs', { screen: destino.tab });
            break;
          }
          // 'categoria': móvil todavía no tiene una pantalla por categoría;
          // Tiqui igual la nombra en lo que dice.
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
       * `agregarAlCarrito`/`eliminarDelCarrito` de arriba no cambian
       * `dataRef.current` al instante: lo actualiza el próximo render de
       * TiendaContext, que todavía no pasó en este mismo tick. Leer el total
       * ahora mismo diría un número viejo justo en el caso que más importa
       * que esté bien: "dos manzanas y cuánto llevo" en la misma frase. Un
       * `setTimeout` a 0 alcanza — para cuando corre, ya hubo tiempo de
       * volver a renderizar y `dataRef.current` está al día.
       */
      setTimeout(() => {
        // Los tres se pisan a propósito, en este orden: un producto +18 sin
        // confirmar es lo más urgente de decir, y comprar/total con el monto
        // real pesa más que la frase suelta que haya dicho la IA.
        let dice = idea.respuesta;

        if (bloqueados.length) {
          const lista = bloqueados.join(' y ');
          const verbo = bloqueados.length === 1 ? 'es' : 'son';
          dice = `${lista} ${verbo} para mayores de edad. Ábrelo desde la tienda para confirmar tu identificación.`;
        } else if (pideComprar) {
          const { carrito, totalCarrito } = dataRef.current;
          if (!carrito.length) {
            dice = 'Tu carrito está vacío. ¿Qué te gustaría llevar?';
          } else {
            confirmandoRef.current = true;
            dice = `Tu total es $${totalCarrito.toFixed(2)} con ${contarItems(carrito)} productos. ¿Confirmas la compra? Di sí para confirmar.`;
          }
        } else if (pideTotal) {
          const { carrito, totalCarrito } = dataRef.current;
          dice = `Llevas $${totalCarrito.toFixed(2)} en ${contarItems(carrito)} productos.`;
        }

        hablarRef.current?.(dice);
      }, 0);
    } finally {
      setPensando(false);
    }
  }, [mayorConfirmado, isAuthenticated]);

  const procesar = useCallback((texto) => {
    const t = expandirSinonimos(normalizar(texto));
    const { carrito, totalCarrito } = dataRef.current;
    const fns = fnRef.current;

    silencioRef.current = 0;
    registrar('user', texto);

    // ── Esperando "sí" o "no" para confirmar la compra ──
    if (confirmandoRef.current) {
      if (/\b(si|sí|claro|confirmo|dale|correcto|comprar)\b/.test(t)) {
        confirmandoRef.current = false;
        // Se apaga el asistente antes de irse a pagar: seguir escuchando en
        // segundo plano mientras la persona mira el checkout no tiene caso, y
        // sí puede gastar batería o agarrar algo que se dice sin querer.
        activoRef.current = false;
        setActivo(false);
        hablar('Te llevo a pagar.');
        navegarA('Checkout');
      } else if (/\b(no|cancela|espera|todavia|todavía|aun|aún)\b/.test(t)) {
        confirmandoRef.current = false;
        hablar('Ok, seguimos. ¿Qué más quieres agregar?');
      } else {
        hablar('¿Confirmas la compra? Di sí para confirmar, o no para seguir agregando.');
      }
      return;
    }

    if (/\b(ayuda|que puedo decir|comandos|no se|no entiendo)\b/.test(t)) {
      hablar('Puedes decirme: quiero una manzana y dos galletas, qué ofertas hay, muéstrame las manzanas, quita una manzana, cuánto llevo, borra el carrito o comprar.');
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
    if (PIDE_COMPRAR(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      confirmandoRef.current = true;
      hablar(`Tu total es $${totalCarrito.toFixed(2)} con ${contarItems(carrito)} productos. ¿Confirmas la compra? Di sí para confirmar.`);
      return;
    }
    if (PIDE_TOTAL.test(t)) {
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

    // ── Llevarlo a un apartado, o mostrarle un producto ──
    if (PIDE_IR.test(t)) {
      const destino = DESTINOS.find((d) => d.palabras.test(t));
      if (destino) {
        if (destino.sesion && !isAuthenticated) {
          hablar('Necesitas iniciar sesión para eso.');
          return;
        }
        if (destino.ruta) navegarA(destino.ruta);
        else navegarA('Tabs', { screen: destino.tab });
        hablar(`Te abro ${destino.nombre}.`);
        return;
      }

      // No es un apartado: ¿es un producto? ("muéstrame las manzanas").
      const prod = buscarProducto(t);
      if (prod && fns.mostrarProducto) {
        fns.mostrarProducto(prod);
        hablar(`Aquí está ${prod.nombre}, a $${Number(prod.precio).toFixed(2)}.`);
        return;
      }

      // Ni apartado ni producto: antes esto se colaba hasta "agregar" de
      // abajo y terminaba metiendo al carrito algo que solo se quería VER.
      // Que lo intente la IA, igual que cuando las reglas de agregar fallan.
      preguntarALaIA(texto);
      return;
    }

    // ── Preguntas: a Tiqui, nunca al carrito ("¿la leche está en oferta?") ──
    // Con signos de pregunta va a la IA aunque también pida algo: ella agrega Y contesta.
    const conSignos = /[¿?]/.test(texto);
    if ((conSignos || ES_PREGUNTA.test(t)) && (conSignos || !PIDE_AGREGAR.test(t))) {
      preguntarALaIA(texto);
      return;
    }

    // ── Agregar (varios por frase) ──
    const partes = t.split(/\s+y\s+|,|\s+tambien\s+|\s+ademas\s+/).map((s) => s.trim()).filter(Boolean);
    const agregados = [];
    // Productos +18 encontrados pero NO agregados: sin confirmar la edad, la
    // voz no mete un producto restringido al carrito por su cuenta — mismo
    // candado que la tarjeta y la ficha, solo que aquí no hay a dónde abrir
    // un modal de DUI en medio de la conversación, así que se explica y ya.
    const bloqueados = [];
    /*
     * Lo que se pidió pero está agotado. Antes se "agregaba" igual: el
     * carrito lo rechazaba en silencio y el asistente decía "Agregué 1 leche"
     * sobre una leche que nunca entró. Ahora se dice que se acabó.
     */
    const agotados = [];
    const vistos = new Set();
    for (const parte of partes) {
      const prod = buscarProducto(parte);
      if (prod && !vistos.has(prod.id)) {
        vistos.add(prod.id);
        if ((Number(prod.stock) || 0) <= 0) {
          agotados.push(prod.nombre);
          continue;
        }
        if (esSoloAdultos(prod) && !mayorConfirmado) {
          bloqueados.push(prod.nombre);
          continue;
        }
        const cant = cantidadExplicita(parte) ?? 1;
        fns.agregarAlCarrito?.(prod, cant);
        agregados.push(`${cant} ${prod.nombre}`);
      }
    }

    if (agregados.length === 0 && bloqueados.length === 0 && agotados.length === 0) {
      // Las reglas se dieron por vencidas: que lo intente la IA antes de
      // decir que no se entendió nada.
      preguntarALaIA(texto);
      return;
    }

    const piezas = [];
    if (agregados.length) {
      piezas.push(
        agregados.length === 1
          ? `Agregué ${agregados[0]}`
          : `Agregué ${agregados.slice(0, -1).join(', ')} y ${agregados[agregados.length - 1]}`
      );
    }
    if (agotados.length) {
      piezas.push(`Hoy se nos ${agotados.length === 1 ? 'acabó' : 'acabaron'} ${agotados.join(' y ')}`);
    }
    if (bloqueados.length) {
      const lista = bloqueados.join(' y ');
      const verbo = bloqueados.length === 1 ? 'es' : 'son';
      piezas.push(`${lista} ${verbo} para mayores de edad. Ábrelo desde la tienda para confirmar tu identificación.`);
    }
    const dicho = piezas.join('. ');
    const pregunta = agregados.length ? '¿Algo más?' : agotados.length && !bloqueados.length ? '¿Te busco otra cosa?' : '';
    // Con punto antes de la pregunta, sin duplicarlo si la última pieza ya lo trae.
    hablar(pregunta ? `${dicho}${dicho.endsWith('.') ? '' : '.'} ${pregunta}` : dicho);
  }, [hablar, preguntarALaIA, isAuthenticated, mayorConfirmado]);
  procesarRef.current = procesar;

  // ── Eventos del reconocedor nativo ──
  useSpeechRecognitionEvent('start', () => setEscuchando(true));

  useSpeechRecognitionEvent('result', (event) => {
    const t = event.results?.[0]?.transcript || '';
    if (event.isFinal) finalTextoRef.current = t;
    setTranscripcion(t);
  });

  useSpeechRecognitionEvent('error', () => setEscuchando(false));

  useSpeechRecognitionEvent('end', () => {
    setEscuchando(false);
    const texto = finalTextoRef.current.trim();
    finalTextoRef.current = '';

    if (texto) {
      procesarRef.current?.(texto);
      return;
    }

    // Silencio: paciente, solo repregunta tras varios seguidos y con
    // cooldown — igual que la web (ver useVoiceAssistant.js allá).
    if (!activoRef.current || hablandoRef.current) return;

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
      setTimeout(() => arrancarRef.current?.(), REINTENTO_SILENCIO_MS);
    }
  });

  const iniciar = useCallback(async () => {
    try {
      const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        hablar('Necesito permiso del micrófono para escucharte. Actívalo en los ajustes del teléfono.');
        return;
      }
    } catch {
      // El módulo nativo no está disponible: pasa en Expo Go, que no lo trae.
      // Hace falta una compilación propia (npx expo run:android / run:ios).
      hablar('El reconocimiento de voz no está disponible en esta compilación de la app.');
      return;
    }
    activoRef.current = true;
    setActivo(true);
    arrancarReconocimiento();
  }, [hablar, arrancarReconocimiento]);

  const interrumpir = useCallback(() => {
    callarTiqui();
    Speech.stop();
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
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* no estaba escuchando */ }
    callarTiqui();
    Speech.stop();
  }, []);

  const toggleMute = useCallback(() => {
    setMuteado((m) => !m);
    callarTiqui();
    Speech.stop();
  }, []);

  const cambiarVelocidad = useCallback(() => {
    setVelIndex((i) => (i + 1) % VELOCIDADES.length);
  }, []);

  // Al salir del apartado: apagar todo, no dejarlo escuchando ni hablando
  // de fondo en otra pantalla.
  useEffect(() => {
    return () => {
      const teniaSesion = activoRef.current;
      activoRef.current = false;
      try { ExpoSpeechRecognitionModule.stop(); } catch { /* no estaba escuchando */ }
      if (teniaSesion) {
        callarTiqui();
        Speech.stop();
      }
    };
  }, []);

  return {
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    velLabel: VELOCIDADES[velIndex].label,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, interrumpir,
  };
};

export default useAsistenteVoz;
