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
 * Y lo que se dejó AFUERA a propósito, para que esto fuera un apartado y no
 * un mes de trabajo:
 *   - Elegir voz del sistema (aquí el teléfono elige la suya en español).
 *   - Llevar a una sección de la cuenta específica o abrir un producto en su
 *     ficha: móvil no tiene esas pantallas conectadas a una ruta global
 *     todavía (ver `Asistente.js`). Sí navega a los 4 apartados y al carrito.
 *   - El upsell ("por cierto, X está en oferta"): el catálogo mapeado de
 *     móvil no trae el campo `esMasVendido` que usaba esa regla.
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
import { navegarA } from '../navigation/navigationRef';

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
  { palabras: /\b(mis pedidos|mi pedido|pedidos|ordenes|compras)\b/, nombre: 'sus pedidos', tab: 'pedidos', sesion: true },
  { palabras: /\b(mi perfil|mi cuenta|mis datos)\b/, nombre: 'su cuenta', tab: 'perfil', sesion: true },
  { palabras: /\b(mi carrito|el carrito|carrito)\b/, nombre: 'su carrito', ruta: 'Carrito' },
  { palabras: /\b(inicio|la tienda|el catalogo|el catálogo)\b/, nombre: 'el inicio', tab: 'inicio' },
];
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

  const registrar = (tipo, texto) => {
    setHistorial((h) => [...h.slice(-7), { id: idRef.current++, tipo, texto }]);
  };

  const arrancarReconocimiento = useCallback(() => {
    if (!activoRef.current) return;
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

    Speech.stop();
    hablandoRef.current = true;
    setHablando(true);
    Speech.speak(texto, {
      // "es-419" (español latinoamericano neutro) en vez de es-SV: no todos
      // los teléfonos traen una voz de El Salvador instalada, y esta es la
      // que con más frecuencia sí encuentra una voz decente del sistema.
      language: 'es-419',
      rate: rateRef.current,
      onDone: continuar,
      onStopped: continuar,
      onError: continuar,
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

  const preguntarALaIA = useCallback(async (frase) => {
    const { productos, carrito } = dataRef.current;
    const fns = fnRef.current;

    setPensando(true);
    try {
      const idea = await asistenteApi.entenderPedido({
        frase,
        productos: productos.map((p) => ({ nombre: p.nombre, precio: p.precio })),
        carrito: carrito.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
      });

      if (!idea?.entendido) {
        hablarRef.current?.('No le entendí bien. Puedo ayudarle a agregar productos, ver su total o vaciar el carrito.');
        return;
      }

      const prod = idea.producto ? productos.find((p) => p.nombre === idea.producto) : null;

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
        hablar('Le llevo a pagar.');
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
      hablar('Puedes decir: quiero una manzana y dos galletas, muéstrame las manzanas, quita una manzana, cuánto llevo, vaciar carrito, o comprar.');
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

    // ── Llevarlo a un apartado, o mostrarle un producto ──
    if (PIDE_IR.test(t)) {
      const destino = DESTINOS.find((d) => d.palabras.test(t));
      if (destino) {
        if (destino.sesion && !isAuthenticated) {
          hablar('Necesita iniciar sesión para eso.');
          return;
        }
        if (destino.ruta) navegarA(destino.ruta);
        else navegarA('Tabs', { screen: destino.tab });
        hablar(`Le abro ${destino.nombre}.`);
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
      // Las reglas se dieron por vencidas: que lo intente la IA antes de
      // decir que no se entendió nada.
      preguntarALaIA(texto);
      return;
    }

    const mensaje = agregados.length === 1
      ? `Agregué ${agregados[0]}. ¿Algo más?`
      : `Agregué ${agregados.slice(0, -1).join(', ')} y ${agregados[agregados.length - 1]}. ¿Algo más?`;

    hablar(mensaje);
  }, [hablar, preguntarALaIA, isAuthenticated]);
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
        hablar('Necesito permiso del micrófono para escucharle. Actívelo en los ajustes del teléfono.');
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
    Speech.stop();
  }, []);

  const toggleMute = useCallback(() => {
    setMuteado((m) => !m);
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
      if (teniaSesion) Speech.stop();
    };
  }, []);

  return {
    activo, escuchando, muteado, transcripcion, historial, pensando, hablando,
    velLabel: VELOCIDADES[velIndex].label,
    iniciar, detener, toggleMute, cambiarVelocidad, hablar, interrumpir,
  };
};

export default useAsistenteVoz;
