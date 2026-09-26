/*
 * ============================================================
 * TIQUI DEL PANEL EN EL TELÉFONO — la conversación (useTiquiAdmin.js)
 * ============================================================
 * La asistente del equipo en el teléfono del administrador (solo él la ve:
 * el empleado entra directo al Reparto, ver ModoPersonal). La misma de la
 * esquina del panel web (useTiquiPanel), con el micrófono y la voz del
 * teléfono. Es OTRA asistente que la de la tienda (useAsistenteVoz): no
 * comparten charla ni sesión, y nunca están montadas a la vez (App.js monta
 * la tienda o el modo personal, no los dos), así que tampoco se pisan
 * los eventos del reconocedor de voz, que son globales.
 *
 * Cómo se conversa:
 *   - Tocarla la despierta y escucha; contesta hablando y vuelve a escuchar
 *     por si hay otra pregunta. Si nadie dice nada dos veces, se duerme.
 *   - También se le escribe (en una reunión, o si el micrófono no está).
 *   - Si propone un cambio ("¿Lo hago?"), se contesta con los botones o con
 *     un "sí" / "no" corto. Nada se cambia sin eso: lo exige el servidor.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { personalApi } from '../api/personalApi';
import { usePersonal } from '../context/PersonalContext';
import { decirConTiqui, callarTiqui, vozTiquiPosible, paraDecir } from '../utils/vozTiqui';

const SILENCIOS_ANTES_DE_DESCANSAR = 2;
const REINTENTO_SILENCIO_MS = 900;

const SIN_RESPUESTA = {
  'sin-ia': 'Ahorita no tengo con qué pensar: falta configurar la IA en el servidor.',
  tope: 'Me hiciste muchas preguntas seguidas. Dame un minuto y seguimos.',
  lento: 'El servidor se estaba despertando y tardó mucho. Pregúntame otra vez, ahora ya contesto rápido.',
  'sin-red': 'No me pude conectar con el servidor. Revisa el internet y me vuelves a preguntar.',
};
const NO_ENTENDI = 'No te entendí bien. ¿Me lo repites?';

// "Sí" y "no" cortos contestan el "¿Lo hago?" sin pasar por la IA (igual que en la web).
const plano = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const ES_SI = /^(si|sip|dale|hazlo|confirmo|confirmado|confirma|ok|okay|va|claro|adelante|de acuerdo|correcto|asi es|simon|sale|por favor)( .*)?$/;
const ES_NO = /^(no|nel|cancela|cancelalo|mejor no|olvidalo|dejalo|espera|todavia no)( .*)?$/;
const respuestaCorta = (frase, patron) => {
  const t = plano(frase);
  return t.split(' ').length <= 4 && patron.test(t);
};

export const useTiquiAdmin = () => {
  const { sesion, salir } = usePersonal();
  const token = sesion?.token;

  const [activo, setActivo] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [transcripcion, setTranscripcion] = useState('');
  const [mensajes, setMensajes] = useState([]); // [{ id, quien: 'tiqui'|'persona', texto }]
  const [pendiente, setPendiente] = useState(null); // { token, resumen }
  const [muteada, setMuteada] = useState(false);

  const activoRef = useRef(false);
  const hablandoRef = useRef(false);
  const muteRef = useRef(false);
  const vozTiquiRef = useRef(false);
  const fallasVozRef = useRef(0);
  const silencioRef = useRef(0);
  const finalRef = useRef('');
  const idRef = useRef(0);
  const memoriaRef = useRef([]);
  const pendienteRef = useRef(null);
  const tokenRef = useRef(token);
  const procesarRef = useRef(null);
  const escucharRef = useRef(null);

  useEffect(() => { muteRef.current = muteada; }, [muteada]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const registrar = (quien, texto) => {
    memoriaRef.current = [...memoriaRef.current.slice(-7), { quien, texto }];
    setMensajes((m) => [...m.slice(-11), { id: idRef.current++, quien, texto }]);
  };

  const guardarPendiente = (p) => {
    pendienteRef.current = p;
    setPendiente(p);
  };

  const callarTodo = () => {
    callarTiqui();
    Speech.stop();
  };

  // Despierta el servidor (Render lo duerme) y pregunta si hay voz de Tiqui.
  useEffect(() => {
    if (!token) return undefined;
    let vivo = true;
    personalApi.despertar(token).then(({ voz, origen }) => {
      if (!vivo) return;
      if (origen === 'sesion') { salir(); return; }
      vozTiquiRef.current = voz && vozTiquiPosible;
    });
    return () => { vivo = false; };
  }, [token, salir]);

  const escuchar = useCallback(() => {
    if (!activoRef.current) return;
    callarTodo();
    hablandoRef.current = false;
    finalRef.current = '';
    setTranscripcion('');
    try {
      ExpoSpeechRecognitionModule.start({ lang: 'es-SV', interimResults: true, continuous: false });
    } catch {
      // Ya estaba escuchando, o no hay reconocedor: el evento "error" avisa.
    }
  }, []);

  const hablar = useCallback((texto) => {
    registrar('tiqui', texto);

    const continuar = () => {
      hablandoRef.current = false;
      setHablando(false);
      if (activoRef.current) setTimeout(() => escucharRef.current?.(), 350);
    };

    if (muteRef.current) { continuar(); return; }

    callarTodo();
    hablandoRef.current = true;
    setHablando(true);

    const conElTelefono = () => Speech.speak(paraDecir(texto), {
      language: 'es-419',
      onDone: continuar,
      onStopped: continuar,
      onError: continuar,
    });

    if (!vozTiquiRef.current) { conElTelefono(); return; }
    decirConTiqui(personalApi.urlVoz(texto), {
      alTerminar: () => { fallasVozRef.current = 0; continuar(); },
      alFallar: () => {
        fallasVozRef.current += 1;
        if (fallasVozRef.current >= 2) vozTiquiRef.current = false;
        conElTelefono();
      },
    });
  }, []);

  // Hace el cambio que se confirmó (tocando "Sí, hazlo" o diciendo que sí).
  const confirmar = useCallback(async () => {
    const p = pendienteRef.current;
    if (!p) return;
    guardarPendiente(null);
    setPensando(true);
    const r = await personalApi.confirmar(tokenRef.current, p.token);
    setPensando(false);
    if (r?.origen === 'sesion') { salir(); return; }
    hablar(r?.respuesta || SIN_RESPUESTA[r?.origen] || 'No pude hacerlo. Pídemelo otra vez.');
  }, [hablar, salir]);

  const descartar = useCallback(() => {
    if (!pendienteRef.current) return;
    guardarPendiente(null);
    hablar('Listo, no cambio nada.');
  }, [hablar]);

  const procesar = useCallback(async (frase) => {
    const historial = memoriaRef.current.slice(-6);
    registrar('persona', frase);
    setTranscripcion('');

    if (pendienteRef.current) {
      if (respuestaCorta(frase, ES_SI)) { confirmar(); return; }
      if (respuestaCorta(frase, ES_NO)) { descartar(); return; }
      guardarPendiente(null); // pidió otra cosa: lo propuesto queda sin hacer
    }

    setPensando(true);
    const r = await personalApi.conversar(tokenRef.current, { frase, historial });
    setPensando(false);
    if (r?.origen === 'sesion') { salir(); return; }
    if (r?.confirmar?.token) guardarPendiente({ token: r.confirmar.token, resumen: r.confirmar.resumen });
    hablar(r?.entendido && r.respuesta ? r.respuesta : SIN_RESPUESTA[r?.origen] || NO_ENTENDI);
  }, [hablar, confirmar, descartar, salir]);

  useEffect(() => {
    procesarRef.current = procesar;
    escucharRef.current = escuchar;
  }, [procesar, escuchar]);

  // ── Eventos del reconocedor nativo ──
  useSpeechRecognitionEvent('start', () => setEscuchando(true));
  useSpeechRecognitionEvent('result', (event) => {
    const t = event.results?.[0]?.transcript || '';
    if (event.isFinal) finalRef.current = t;
    setTranscripcion(t);
  });
  useSpeechRecognitionEvent('error', () => setEscuchando(false));
  useSpeechRecognitionEvent('end', () => {
    setEscuchando(false);
    const texto = finalRef.current.trim();
    finalRef.current = '';
    if (texto) {
      silencioRef.current = 0;
      procesarRef.current?.(texto);
      return;
    }
    if (!activoRef.current || hablandoRef.current) return;
    silencioRef.current += 1;
    if (silencioRef.current >= SILENCIOS_ANTES_DE_DESCANSAR) {
      silencioRef.current = 0;
      activoRef.current = false;
      setActivo(false);
    } else {
      setTimeout(() => escucharRef.current?.(), REINTENTO_SILENCIO_MS);
    }
  });

  const detener = useCallback(() => {
    activoRef.current = false;
    setActivo(false);
    setEscuchando(false);
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* no estaba escuchando */ }
  }, []);

  // Tocarla: si habla, la interrumpe y escucha; si escucha, la duerme; si duerme, la despierta.
  const tocar = useCallback(async () => {
    if (pensando) return;
    if (escuchando && !hablando) { detener(); return; }
    try {
      const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        hablar('Necesito permiso del micrófono para escucharte. Actívalo en los ajustes del teléfono, o escríbeme.');
        return;
      }
    } catch {
      hablar('El reconocimiento de voz no está disponible en esta compilación de la app. Puedes escribirme.');
      return;
    }
    callarTodo();
    hablandoRef.current = false;
    setHablando(false);
    silencioRef.current = 0;
    activoRef.current = true;
    setActivo(true);
    escuchar();
  }, [pensando, escuchando, hablando, detener, hablar, escuchar]);

  // Escribirle: deja de escuchar (quien escribe quiere seguir escribiendo).
  const escribir = useCallback((texto) => {
    const frase = String(texto || '').trim();
    if (!frase || pensando) return;
    detener();
    callarTodo();
    hablandoRef.current = false;
    setHablando(false);
    procesar(frase);
  }, [pensando, detener, procesar]);

  const alternarVoz = useCallback(() => {
    setMuteada((m) => !m);
    callarTodo();
    hablandoRef.current = false;
    setHablando(false);
  }, []);

  // Al salir del modo administrador: nada sigue escuchando ni hablando.
  useEffect(() => () => {
    activoRef.current = false;
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* no estaba escuchando */ }
    callarTiqui();
    Speech.stop();
  }, []);

  return {
    activo, escuchando, pensando, hablando, transcripcion, mensajes, pendiente, muteada,
    tocar, escribir, confirmar, descartar, alternarVoz,
  };
};

export default useTiquiAdmin;
