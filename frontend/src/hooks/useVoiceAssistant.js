import { useState, useRef, useCallback } from 'react';

/*
 * useVoiceAssistant — el "cerebro" del asistente por voz (Modo Kiosco).
 *
 * Junta TODO: reconocimiento de voz (Web Speech API), voz bidireccional
 * (SpeechSynthesis), y un matcher local que de una frase saca cantidad +
 * producto y opera sobre el carrito que le pasa la tienda por parámetros.
 *
 * Recibe del store (useStore): la lista de productos y las funciones del carrito.
 * Así comparte el MISMO carrito que la tienda (no crea uno nuevo).
 *
 * Comandos que entiende:
 *   - "quiero / agrega / dame [cantidad] <producto>"  -> agrega al carrito
 *   - "quita / elimina <producto>"                     -> lo saca del carrito
 *   - "cuánto llevo / total"                           -> dice el total
 *   - "comprar / pagar / listo"                        -> confirma el carrito
 */

// Palabras de cantidad -> número.
const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};

const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => sinAcentos(s).toLowerCase().trim();

export const useVoiceAssistant = ({ productos = [], agregarAlCarrito, eliminarDelCarrito, carrito = [], totalCarrito = 0 }) => {
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const recognitionRef = useRef(null);

  const soportado =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Voz: el asistente habla y guardamos lo dicho para mostrarlo en pantalla.
  const hablar = useCallback((texto) => {
    setRespuesta(texto);
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-SV';
    u.rate = 0.95; // un pelín más lento, se entiende mejor (tercera edad)
    window.speechSynthesis.speak(u);
  }, []);

  // Cuenta cuántos productos hay en el carrito.
  const contarItems = (lista) => lista.reduce((acc, i) => acc + i.cantidad, 0);

  // Busca el producto que mejor coincide con lo que dijo el cliente.
  const buscarProducto = useCallback((texto) => {
    const t = normalizar(texto);
    return productos.find((p) => {
      const nombre = normalizar(p.nombre);
      if (t.includes(nombre)) return true;
      // o si alguna palabra significativa del nombre aparece en la frase
      return nombre.split(' ').some((w) => w.length > 2 && t.includes(w));
    });
  }, [productos]);

  // Saca la cantidad de la frase (dígito o palabra). Por defecto, 1.
  const extraerCantidad = (texto) => {
    const t = normalizar(texto);
    const digito = t.match(/\b(\d+)\b/);
    if (digito) return parseInt(digito[1], 10);
    for (const [palabra, n] of Object.entries(NUMEROS)) {
      if (new RegExp(`\\b${palabra}\\b`).test(t)) return n;
    }
    return 1;
  };

  // Procesa una frase ya reconocida y actúa + responde por voz.
  const procesar = useCallback((texto) => {
    const t = normalizar(texto);

    // "comprar / pagar / listo"
    if (/\b(comprar|pagar|finalizar|listo|terminar|es todo)\b/.test(t)) {
      if (!carrito.length) { hablar('Tu carrito está vacío. ¿Qué te gustaría llevar?'); return; }
      hablar(`Tu carrito está listo con ${contarItems(carrito)} productos, por $${totalCarrito.toFixed(2)}. Un empleado te ayudará a pagar.`);
      return;
    }

    // "cuánto llevo / total"
    if (/\b(cuanto|total|llevo|va)\b/.test(t)) {
      hablar(`Llevas $${totalCarrito.toFixed(2)} en ${contarItems(carrito)} productos.`);
      return;
    }

    // "quita / elimina <producto>"
    if (/\b(quita|quitar|elimina|eliminar|borra|saca|remueve)\b/.test(t)) {
      const prod = buscarProducto(t);
      if (prod) { eliminarDelCarrito(prod.id); hablar(`Quité ${prod.nombre} del carrito.`); }
      else hablar('No encontré ese producto para quitarlo.');
      return;
    }

    // Por defecto: agregar el producto mencionado.
    const prod = buscarProducto(t);
    if (prod) {
      const cant = extraerCantidad(t);
      agregarAlCarrito(prod, cant);
      const totalAprox = totalCarrito + prod.precio * cant;
      hablar(`Agregué ${cant} ${prod.nombre}. Llevas $${totalAprox.toFixed(2)}. ¿Algo más?`);
    } else {
      hablar('No encontré ese producto. ¿Puedes repetirlo?');
    }
  }, [carrito, totalCarrito, buscarProducto, agregarAlCarrito, eliminarDelCarrito, hablar]);

  // Enciende el micrófono (press-to-talk: escucha una frase y la procesa).
  const iniciar = useCallback(() => {
    if (!soportado) {
      hablar('Tu navegador no soporta reconocimiento de voz. Te recomiendo usar Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-SV';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setEscuchando(true);
    rec.onend = () => setEscuchando(false);
    rec.onerror = () => setEscuchando(false);
    rec.onresult = (e) => {
      const texto = e.results[0][0].transcript;
      setTranscripcion(texto);
      procesar(texto);
    };
    recognitionRef.current = rec;
    rec.start();
  }, [soportado, procesar, hablar]);

  const detener = useCallback(() => {
    recognitionRef.current?.stop();
    setEscuchando(false);
  }, []);

  return { escuchando, transcripcion, respuesta, iniciar, detener, hablar, soportado };
};
