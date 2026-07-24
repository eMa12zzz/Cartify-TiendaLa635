import { useRef, useState, useCallback } from 'react';

/*
 * useVoiceAssistant — el "cerebro" del asistente por voz (Modo Kiosco).
 *
 * Incluye:
 *   - Escucha CONTINUA / manos libres: tras cada frase vuelve a escuchar solo.
 *   - Transcripción EN VIVO (interimResults) mientras el cliente habla.
 *   - Voz bidireccional (SpeechSynthesis) con "barge-in": al escuchar, se calla.
 *   - Matcher local que saca cantidad + producto de la frase.
 *
 * Comandos: "quiero/agrega [n] X", "quita [n] X", "cuánto llevo", "vaciar
 * carrito", "ayuda", "repite", "comprar".
 *
 * Recibe del store (useStore) la lista de productos y las funciones del carrito,
 * así comparte el MISMO carrito que la tienda.
 */

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => sinAcentos(s).toLowerCase().trim();
const contarItems = (lista) => lista.reduce((a, i) => a + i.cantidad, 0);

// Cantidad explícita en la frase (dígito o palabra). null = no se dijo cantidad.
const cantidadExplicita = (texto) => {
  const t = normalizar(texto);
  const d = t.match(/\b(\d+)\b/);
  if (d) return parseInt(d[1], 10);
  for (const [p, n] of Object.entries(NUMEROS)) {
    if (new RegExp(`\\b${p}\\b`).test(t)) return n;
  }
  return null;
};

export const useVoiceAssistant = ({
  productos = [], carrito = [], totalCarrito = 0,
  agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito,
}) => {
  const [activo, setActivo] = useState(false);         // sesión manos libres encendida
  const [escuchando, setEscuchando] = useState(false); // capturando audio ahora mismo
  const [transcripcion, setTranscripcion] = useState('');
  const [respuesta, setRespuesta] = useState('');

  // Refs con datos/funciones SIEMPRE frescos (evita closures viejos en el loop).
  const dataRef = useRef({ productos, carrito, totalCarrito });
  dataRef.current = { productos, carrito, totalCarrito };
  const fnRef = useRef({});
  fnRef.current = { agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, limpiarCarrito };

  const recognitionRef = useRef(null);
  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const ultimaRespuestaRef = useRef('');
  const procesarRef = useRef(null); // se asigna más abajo (evita TDZ)

  const soportado =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Enciende el micrófono para una frase. Al terminar, procesa o reintenta.
  const arrancarReconocimiento = useCallback(() => {
    if (!soportado || !activoRef.current) return;

    // Barge-in: si el asistente estaba hablando, lo callamos al ponernos a escuchar.
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    hablandoRef.current = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-SV';
    rec.continuous = false;
    rec.interimResults = true; // transcripción en vivo
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
        // No se entendió nada: seguimos escuchando (manos libres).
        setTimeout(() => arrancarReconocimiento(), 500);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ya estaba iniciado */ }
  }, [soportado]);

  // El asistente habla; al terminar de hablar vuelve a escuchar (manos libres).
  const hablar = useCallback((texto) => {
    setRespuesta(texto);
    ultimaRespuestaRef.current = texto;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    hablandoRef.current = true;

    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-SV';
    u.rate = 0.95; // un pelín más lento, se entiende mejor (tercera edad)
    const alTerminar = () => {
      hablandoRef.current = false;
      if (activoRef.current) setTimeout(() => arrancarReconocimiento(), 350);
    };
    u.onend = alTerminar;
    u.onerror = alTerminar;
    window.speechSynthesis.speak(u);
  }, [arrancarReconocimiento]);

  // Busca el producto que mejor coincide con lo que dijo el cliente.
  const buscarProducto = (texto) => {
    const t = normalizar(texto);
    return dataRef.current.productos.find((p) => {
      const nombre = normalizar(p.nombre);
      if (t.includes(nombre)) return true;
      return nombre.split(' ').some((w) => w.length > 2 && t.includes(w));
    });
  };

  // Procesa una frase reconocida: actúa sobre el carrito y responde por voz.
  const procesar = useCallback((texto) => {
    const t = normalizar(texto);
    const { carrito, totalCarrito } = dataRef.current;
    const fns = fnRef.current;

    if (/\b(ayuda|que puedo decir|comandos|no se|no entiendo)\b/.test(t)) {
      hablar('Puedes decir: quiero una manzana, quita una manzana, cuánto llevo, vaciar carrito, o comprar.');
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
    if (/\b(comprar|pagar|finalizar|listo|terminar|es todo)\b/.test(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      hablar(`Tu carrito está listo con ${contarItems(carrito)} productos, por $${totalCarrito.toFixed(2)}. Un empleado te ayudará a pagar.`);
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

    // Por defecto: agregar el producto mencionado.
    const prod = buscarProducto(t);
    if (prod) {
      const cant = cantidadExplicita(t) ?? 1;
      fns.agregarAlCarrito?.(prod, cant);
      const totalAprox = totalCarrito + prod.precio * cant;
      hablar(`Agregué ${cant} ${prod.nombre}. Llevas $${totalAprox.toFixed(2)}. ¿Algo más?`);
    } else {
      hablar('No encontré ese producto. ¿Puedes repetirlo?');
    }
  }, [hablar]);

  // Mantenemos procesarRef apuntando al procesar más reciente (lo usa onend).
  procesarRef.current = procesar;

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

  return { activo, escuchando, transcripcion, respuesta, iniciar, detener, hablar, soportado };
};
