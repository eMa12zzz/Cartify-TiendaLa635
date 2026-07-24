import { useRef, useState, useCallback, useEffect } from 'react';

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

export const useVoiceAssistant = ({
  productos = [], carrito = [], totalCarrito = 0,
  agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
}) => {
  const [activo, setActivo] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [muteado, setMuteado] = useState(false);
  const [velIndex, setVelIndex] = useState(1); // Normal
  const [transcripcion, setTranscripcion] = useState('');
  const [historial, setHistorial] = useState([]);

  const dataRef = useRef({ productos, carrito, totalCarrito });
  dataRef.current = { productos, carrito, totalCarrito };
  const fnRef = useRef({});
  fnRef.current = { agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito };

  const recognitionRef = useRef(null);
  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const muteRef = useRef(false); muteRef.current = muteado;
  const rateRef = useRef(0.95); rateRef.current = VELOCIDADES[velIndex].v;
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null);
  const hablarRef = useRef(null);
  const confirmandoRef = useRef(false); // esperando "sí" para comprar
  const silencioRef = useRef(0);
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
        // Silencio: reintenta y, tras 2 silencios seguidos, re-pregunta.
        silencioRef.current += 1;
        if (silencioRef.current >= 2) {
          silencioRef.current = 0;
          hablarRef.current?.('¿Sigues ahí? Dime qué quieres, o di comprar cuando termines.');
        } else {
          setTimeout(() => arrancarReconocimiento(), 500);
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
      if (activoRef.current) setTimeout(() => arrancarReconocimiento(), 350);
    };

    if (muteRef.current || typeof window === 'undefined' || !window.speechSynthesis) {
      continuar();
      return;
    }

    window.speechSynthesis.cancel();
    hablandoRef.current = true;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-SV';
    u.rate = rateRef.current;
    // Elegimos una voz en español si el navegador tiene alguna.
    const vozEs = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (vozEs) u.voice = vozEs;
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
        hablar('¡Listo! Lleva tu carrito a caja, un empleado te ayudará a pagar. ¡Gracias!');
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
      hablar('No encontré ese producto. ¿Puedes repetirlo?');
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
  }, [hablar]);

  procesarRef.current = procesar;
  hablarRef.current = hablar;

  const iniciar = useCallback(() => {
    if (!soportado) { hablar('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'); return; }
    activoRef.current = true;
    setActivo(true);
    arrancarReconocimiento();
  }, [soportado, hablar, arrancarReconocimiento]);

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

  return {
    activo, escuchando, muteado, transcripcion, historial,
    velLabel: VELOCIDADES[velIndex].label,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, soportado,
  };
};
