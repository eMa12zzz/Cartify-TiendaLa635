import { useRef, useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';

/*
 * Carga PROTEGIDA del reconocedor de voz. @react-native-voice/voice es un
 * módulo nativo que NO existe en Expo Go; un import directo tumbaría la app al
 * arrancar (porque App carga esta pantalla). Con require en try/catch, si no
 * está, `Voice` queda null y el asistente avisa que necesita development build,
 * sin romper el resto de la app.
 */
let Voice = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  Voice = null;
}

/*
 * useAsistenteVoz — el "cerebro" del asistente por voz, adaptado a React Native.
 * Puerto de `frontend/src/hooks/useVoiceAssistant.js`.
 *
 * Cambia SOLO la tecnología de voz, no la gramática de comandos:
 *   - Escuchar: Web Speech API  →  @react-native-voice/voice (STT del sistema).
 *   - Hablar:   speechSynthesis  →  expo-speech (Speech.speak).
 * Se quita el respaldo con IA (aiService) y el selector de voces del sistema,
 * que dependían del navegador. Todo lo demás —agregar varios por frase,
 * confirmar antes de comprar, quitar por cantidad, ir a producto/categoría,
 * total, vaciar— es igual que la web.
 *
 * Nota: el reconocimiento de voz necesita un development build (no Expo Go) y
 * permiso de micrófono.
 */

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

const IDIOMA = 'es-MX'; // el reconocedor y la voz en español latino

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

const PIDE_IR = /\b(ver|vamos|llevame|muestrame|ensename|abrir|abre|quiero ver|busca|buscar|donde esta|ir a)\b/;

export const useAsistenteVoz = ({
  productos = [], carrito = [], totalCarrito = 0,
  agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
  irAProducto, irACategoria, categorias = [],
  alConfirmarCompra,
}) => {
  const [activo, setActivo] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [muteado, setMuteado] = useState(false);
  const [velIndex, setVelIndex] = useState(1);
  const [transcripcion, setTranscripcion] = useState('');
  const [hablando, setHablando] = useState(false);
  const [historial, setHistorial] = useState([]);

  const dataRef = useRef({ productos, carrito, totalCarrito, categorias });
  dataRef.current = { productos, carrito, totalCarrito, categorias };
  const fnRef = useRef({});
  fnRef.current = { agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito, irAProducto, irACategoria, alConfirmarCompra };

  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const muteRef = useRef(false); muteRef.current = muteado;
  const rateRef = useRef(0.95); rateRef.current = VELOCIDADES[velIndex].v;
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null);
  const hablarRef = useRef(null);
  const confirmandoRef = useRef(false);
  const finalRef = useRef('');
  const idRef = useRef(0);

  const registrar = (tipo, texto) =>
    setHistorial((h) => [...h.slice(-7), { id: idRef.current++, tipo, texto }]);

  const arrancarReconocimiento = useCallback(async () => {
    if (!activoRef.current || hablandoRef.current || !Voice) return;
    finalRef.current = '';
    try {
      await Voice.start(IDIOMA);
    } catch {
      // ya estaba escuchando o falta permiso; se reintenta al próximo turno
    }
  }, []);

  const hablar = useCallback((texto) => {
    ultimaRespuestaRef.current = texto;
    registrar('bot', texto);

    const continuar = () => {
      hablandoRef.current = false;
      setHablando(false);
      if (activoRef.current) setTimeout(() => arrancarReconocimiento(), 350);
    };

    if (muteRef.current) { continuar(); return; }

    Speech.stop();
    hablandoRef.current = true;
    setHablando(true);
    Speech.speak(texto, {
      language: IDIOMA,
      rate: rateRef.current,
      onDone: continuar,
      onStopped: continuar,
      onError: continuar,
    });
  }, [arrancarReconocimiento]);

  const buscarProducto = (texto) => {
    const t = expandirSinonimos(normalizar(texto));
    return dataRef.current.productos.find((p) => {
      const nombre = normalizar(p.nombre);
      if (t.includes(nombre)) return true;
      return nombre.split(' ').some((w) => w.length > 2 && t.includes(w));
    });
  };

  const procesar = useCallback((texto) => {
    const t = expandirSinonimos(normalizar(texto));
    const { carrito, totalCarrito } = dataRef.current;
    const fns = fnRef.current;
    registrar('user', texto);

    // Esperando confirmación de compra.
    if (confirmandoRef.current) {
      if (/\b(si|claro|confirmo|dale|correcto|comprar)\b/.test(t)) {
        confirmandoRef.current = false;
        fns.alConfirmarCompra?.();
      } else if (/\b(no|cancela|espera|todavia|aun)\b/.test(t)) {
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
    if (/\b(vaciar|vacia|limpiar|empezar de nuevo|borra todo)\b/.test(t)) {
      fns.limpiarCarrito?.();
      hablar('Vacié tu carrito. ¿Qué te gustaría llevar?');
      return;
    }
    if (/\b(comprar|pagar|finalizar|listo|terminar|es todo)\b/.test(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      confirmandoRef.current = true;
      hablar(`Tu total es ${totalCarrito.toFixed(2)} dólares con ${contarItems(carrito)} productos. ¿Confirmas la compra? Di sí para confirmar.`);
      return;
    }
    if (/\b(cuanto|total|llevo|va)\b/.test(t)) {
      hablar(`Llevas ${totalCarrito.toFixed(2)} dólares en ${contarItems(carrito)} productos.`);
      return;
    }
    if (/\b(quita|quitar|elimina|eliminar|borra|saca|remueve)\b/.test(t)) {
      const prod = buscarProducto(t);
      if (!prod) { hablar('No encontré ese producto para quitarlo.'); return; }
      const enCarrito = carrito.find((i) => i.id === prod.id);
      if (!enCarrito) { hablar(`No tienes ${prod.nombre} en el carrito.`); return; }
      const cant = cantidadExplicita(t);
      if (cant === null || cant >= enCarrito.cantidad) {
        fns.eliminarDelCarrito?.(prod.id);
        hablar(`Quité ${prod.nombre} del carrito.`);
      } else {
        fns.actualizarCantidad?.(prod.id, enCarrito.cantidad - cant);
        hablar(`Quité ${cant} ${prod.nombre}. Te quedan ${enCarrito.cantidad - cant}.`);
      }
      return;
    }

    // Ver/ir: producto (más específico) o categoría.
    if (PIDE_IR.test(t)) {
      const prod = buscarProducto(t);
      if (prod && fns.irAProducto) {
        fns.irAProducto(prod);
        hablar(`Aquí está ${prod.nombre}, a ${Number(prod.precio).toFixed(2)} dólares.`);
        return;
      }
      const cat = (dataRef.current.categorias || []).find((cx) => {
        const n = normalizar(String(cx));
        return n.length > 2 && t.includes(n);
      });
      if (cat && fns.irACategoria) {
        fns.irACategoria(cat);
        hablar(`Te muestro ${cat}.`);
        return;
      }
      hablar('No encontré eso. ¿Puedes repetirlo?');
      return;
    }

    // Agregar (varios por frase).
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
      hablar('No encontré ese producto. ¿Puedes repetirlo?');
      return;
    }

    const mensaje = agregados.length === 1
      ? `Agregué ${agregados[0]}. ¿Algo más?`
      : `Agregué ${agregados.slice(0, -1).join(', ')} y ${agregados[agregados.length - 1]}. ¿Algo más?`;
    hablar(mensaje);
  }, [hablar]);

  procesarRef.current = procesar;
  hablarRef.current = hablar;

  // Suscripción a los eventos de @react-native-voice/voice (una vez).
  useEffect(() => {
    if (!Voice) return undefined;
    Voice.onSpeechStart = () => setEscuchando(true);
    Voice.onSpeechResults = (e) => {
      const t = e.value?.[0] || '';
      finalRef.current = t;
      setTranscripcion(t);
    };
    Voice.onSpeechPartialResults = (e) => {
      const t = e.value?.[0];
      if (t) setTranscripcion(t);
    };
    Voice.onSpeechError = () => setEscuchando(false);
    Voice.onSpeechEnd = () => {
      setEscuchando(false);
      const dicho = finalRef.current.trim();
      if (dicho) {
        procesarRef.current?.(dicho);
      } else if (activoRef.current && !hablandoRef.current) {
        setTimeout(() => arrancarReconocimiento(), 500);
      }
    };
    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {});
    };
  }, [arrancarReconocimiento]);

  const iniciar = useCallback(() => {
    if (!Voice) {
      hablar('El asistente de voz necesita un development build en este teléfono. Por ahora no puede escuchar.');
      return;
    }
    activoRef.current = true;
    setActivo(true);
    hablar('Hola, dime qué quieres llevar.');
  }, [hablar]);

  const detener = useCallback(() => {
    activoRef.current = false;
    setActivo(false);
    setEscuchando(false);
    Voice?.stop().catch(() => {});
    Speech.stop();
  }, []);

  const interrumpir = useCallback(() => {
    Speech.stop();
    hablandoRef.current = false;
    setHablando(false);
    activoRef.current = true;
    setActivo(true);
    arrancarReconocimiento();
  }, [arrancarReconocimiento]);

  const toggleMute = useCallback(() => { setMuteado((m) => !m); Speech.stop(); }, []);
  const cambiarVelocidad = useCallback(() => setVelIndex((i) => (i + 1) % VELOCIDADES.length), []);

  // Al desmontar: apagar todo.
  useEffect(() => () => { activoRef.current = false; Voice?.stop().catch(() => {}); Speech.stop(); }, []);

  return {
    activo, escuchando, muteado, transcripcion, historial, hablando,
    velLabel: VELOCIDADES[velIndex].label,
    soportado: !!Voice,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, interrumpir,
  };
};

export default useAsistenteVoz;
