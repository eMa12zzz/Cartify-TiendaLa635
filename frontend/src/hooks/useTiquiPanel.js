import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tiquiPanelService } from '../api/tiquiPanelService';
import { decirConTiqui, callarTiqui, paraDecir } from '../utils/vozTiqui';

/*
 * ============================================================
 * TIQUI DEL PANEL — la conversación (useTiquiPanel.js)
 * ============================================================
 * La asistente del equipo, la que flota en la esquina del panel. Es OTRA
 * asistente que la de la tienda (useVoiceAssistant) y no comparte con ella
 * ni el estado ni la memoria: su charla vive aquí y se va con el panel.
 * Solo usan lo mismo para la voz (utils/vozTiqui.js).
 *
 * Cómo se conversa:
 *   - Tocarla la despierta y se pone a escuchar. Contesta hablando, y en
 *     cuanto termina vuelve a escuchar, por si hay otra pregunta ("¿y
 *     ayer?"). Si nadie dice nada dos veces seguidas, se queda quieta con su
 *     última respuesta en el globo.
 *   - También se le puede escribir: en una oficina con gente, o en un
 *     navegador sin reconocimiento de voz. Escribiéndole no se pone a
 *     escuchar después: quien escribe quiere seguir escribiendo.
 *   - Tocarla mientras habla la interrumpe y escucha de una vez.
 *
 * Lo que contesta puede traer una pantalla a abrir (los pedidos por preparar,
 * la leche en el inventario): se navega aquí, sin recargar, y la charla sigue.
 * ============================================================
 */

const SILENCIOS_ANTES_DE_DESCANSAR = 2;
const REINTENTO_SILENCIO_MS = 900;
const LLAVE_SILENCIO = 'kartify:tiqui-panel-sin-voz';

// Lo que dice cuando no pudo contestar, según por qué.
const SIN_RESPUESTA = {
  'sin-ia': 'Ahorita no tengo con qué pensar: falta configurar la IA en el servidor.',
  tope: 'Me hiciste muchas preguntas seguidas. Dame un minuto y seguimos.',
  'sin-red': 'No me pude conectar con el servidor. Revisa la conexión y me vuelves a preguntar.',
};
const NO_ENTENDI = 'No te entendí bien. ¿Me lo repites?';

// La voz del sistema (respaldo de la de Tiqui): una latinoamericana si hay.
const ACENTOS = ['es-SV', 'es-MX', 'es-US', 'es-419', 'es-GT', 'es-CO'];
const vozDelSistema = () => {
  const voces = (window.speechSynthesis?.getVoices?.() || []).filter((v) => (v.lang || '').toLowerCase().startsWith('es'));
  return ACENTOS.map((a) => voces.find((v) => v.lang === a)).find(Boolean) || voces[0] || null;
};

export const useTiquiPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [abierta, setAbierta] = useState(false);   // se ve la charla
  const [activo, setActivo] = useState(false);     // charla por voz en curso
  const [escuchando, setEscuchando] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [mensajes, setMensajes] = useState([]);    // [{ id, quien: 'tiqui'|'persona', texto }]
  const [confundida, setConfundida] = useState(false);
  const [vozTiqui, setVozTiqui] = useState(false);
  const [sonandoTiqui, setSonandoTiqui] = useState(false);
  const [muteada, setMuteada] = useState(() => {
    try { return localStorage.getItem(LLAVE_SILENCIO) === '1'; } catch { return false; }
  });

  const soportado = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const recRef = useRef(null);
  const activoRef = useRef(false);
  const muteRef = useRef(muteada);
  const vozTiquiRef = useRef(false);
  const fallasVozRef = useRef(0);
  const silencioRef = useRef(0);
  const despiertaRef = useRef(false);
  const idRef = useRef(0);
  // La charla al día en el mismo instante (el estado llega un render tarde).
  const memoriaRef = useRef([]);
  const pantallaRef = useRef(location.pathname);
  // Las funciones que se llaman desde callbacks del micrófono (que se arman
  // antes de que existan): se leen por ref, siempre la última.
  const procesarRef = useRef(null);
  const escucharRef = useRef(null);

  // Lo que los callbacks leen al momento, al día después de cada render.
  useEffect(() => { muteRef.current = muteada; }, [muteada]);
  useEffect(() => { pantallaRef.current = `${location.pathname}${location.search}`; }, [location.pathname, location.search]);

  const registrar = (quien, texto) => {
    memoriaRef.current = [...memoriaRef.current.slice(-7), { quien, texto }];
    setMensajes((m) => [...m.slice(-7), { id: idRef.current++, quien, texto }]);
  };

  const callarTodo = () => {
    callarTiqui();
    setSonandoTiqui(false);
    window.speechSynthesis?.cancel();
  };

  const pararEscucha = () => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onend = null;
      try { rec.abort(); } catch { /* ya estaba parado */ }
    }
    setEscuchando(false);
  };

  const escuchar = useCallback(() => {
    if (!soportado || !activoRef.current) return;
    callarTodo();
    pararEscucha();
    setTranscripcion('');

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'es-SV';
    rec.continuous = false;
    rec.interimResults = true;
    let dicho = '';

    rec.onstart = () => setEscuchando(true);
    rec.onresult = (e) => {
      let enVivo = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) dicho += t;
        else enVivo += t;
      }
      setTranscripcion(dicho || enVivo);
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => {
      recRef.current = null;
      setEscuchando(false);
      if (dicho.trim()) {
        silencioRef.current = 0;
        procesarRef.current?.(dicho.trim());
        return;
      }
      if (!activoRef.current) return;
      // Silencio: vuelve a escuchar una vez más, y si nada, descansa.
      silencioRef.current += 1;
      if (silencioRef.current >= SILENCIOS_ANTES_DE_DESCANSAR) {
        silencioRef.current = 0;
        activoRef.current = false;
        setActivo(false);
      } else {
        setTimeout(() => escucharRef.current?.(), REINTENTO_SILENCIO_MS);
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch { /* ya estaba escuchando */ }
  }, [soportado]);

  const decirConElSistema = (texto, continuar) => {
    const sintesis = window.speechSynthesis;
    if (!sintesis) { continuar(); return; }
    sintesis.cancel();
    const u = new SpeechSynthesisUtterance(paraDecir(texto));
    const voz = vozDelSistema();
    if (voz) { u.voice = voz; u.lang = voz.lang; } else { u.lang = 'es-SV'; }
    u.onend = continuar;
    u.onerror = continuar;
    sintesis.speak(u);
  };

  const hablar = useCallback((texto) => {
    registrar('tiqui', texto);

    const continuar = () => {
      setHablando(false);
      if (activoRef.current) setTimeout(() => escuchar(), 350);
    };

    if (muteRef.current) { continuar(); return; }

    callarTodo();
    setHablando(true);

    if (vozTiquiRef.current) {
      decirConTiqui(tiquiPanelService.urlVoz(texto), {
        alEmpezar: () => setSonandoTiqui(true),
        alTerminar: () => {
          fallasVozRef.current = 0;
          setSonandoTiqui(false);
          continuar();
        },
        alFallar: () => {
          setSonandoTiqui(false);
          // Dos fallas seguidas: en esta charla ya no se intenta, para no
          // hacer esperar cuatro segundos cada vez.
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
  }, [escuchar]);

  const procesar = useCallback(async (frase) => {
    // Lo de antes de esta frase: la frase misma viaja aparte.
    const historial = memoriaRef.current.slice(-6);
    registrar('persona', frase);
    setTranscripcion('');
    setConfundida(false);
    setPensando(true);

    const r = await tiquiPanelService.conversar({ frase, historial, pantalla: pantallaRef.current });
    setPensando(false);

    const ruta = r?.acciones?.find((a) => a.tipo === 'ir')?.ruta;
    if (ruta) navigate(ruta);

    const texto = r?.entendido && r.respuesta ? r.respuesta : SIN_RESPUESTA[r?.origen] || NO_ENTENDI;
    if (!r?.entendido) setConfundida(true);
    hablar(texto);
  }, [navigate, hablar]);

  useEffect(() => {
    procesarRef.current = procesar;
    escucharRef.current = escuchar;
  }, [procesar, escuchar]);

  // La primera vez que se despierta: el servidor (Render lo duerme) y la voz.
  const prepararServidor = () => {
    if (despiertaRef.current) return;
    despiertaRef.current = true;
    tiquiPanelService.despertar().then(({ voz }) => {
      vozTiquiRef.current = voz;
      setVozTiqui(voz);
    });
  };

  // Tocarla: la despierta y escucha; si está hablando, la interrumpe.
  const tocar = useCallback(() => {
    setAbierta(true);
    prepararServidor();
    if (!soportado) return; // sin micrófono, se le escribe
    if (pensando) return;   // ya va a contestar: otra frase se le encimaría
    if (escuchando && !hablando) {
      activoRef.current = false;
      setActivo(false);
      pararEscucha();
      return;
    }
    callarTodo();
    setHablando(false);
    silencioRef.current = 0;
    activoRef.current = true;
    setActivo(true);
    escuchar();
  }, [soportado, pensando, escuchando, hablando, escuchar]);

  // Escribirle: para de escuchar (quien escribe quiere seguir escribiendo).
  const escribir = useCallback((texto) => {
    const frase = String(texto || '').trim();
    if (!frase || pensando) return;
    setAbierta(true);
    prepararServidor();
    activoRef.current = false;
    setActivo(false);
    pararEscucha();
    callarTodo();
    setHablando(false);
    procesar(frase);
  }, [pensando, procesar]);

  const cerrar = useCallback(() => {
    activoRef.current = false;
    setActivo(false);
    pararEscucha();
    callarTodo();
    setHablando(false);
    setAbierta(false);
  }, []);

  const alternarVoz = useCallback(() => {
    setMuteada((m) => {
      try { localStorage.setItem(LLAVE_SILENCIO, m ? '0' : '1'); } catch { /* modo privado */ }
      return !m;
    });
    callarTodo();
    setHablando(false);
  }, []);

  // Al salir del panel: nada sigue escuchando ni hablando.
  useEffect(() => () => {
    activoRef.current = false;
    pararEscucha();
    callarTiqui();
    window.speechSynthesis?.cancel();
  }, []);

  return {
    abierta, activo, escuchando, pensando, hablando, transcripcion, mensajes, confundida,
    muteada, vozTiqui, sonandoTiqui, soportado,
    tocar, escribir, cerrar, alternarVoz,
  };
};

export default useTiquiPanel;
