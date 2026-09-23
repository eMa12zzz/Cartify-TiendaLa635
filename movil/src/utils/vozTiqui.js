/*
 * ============================================================
 * LA VOZ DE TIQUI EN EL TELÉFONO — vozTiqui.js
 * ============================================================
 * El equivalente de `frontend/src/utils/vozTiqui.js`: reproduce lo que dice
 * Tiqui con su voz (la del video), pedida al servidor en /api/ai/voz. El
 * reproductor empieza a sonar mientras el audio llega.
 *
 * `expo-audio` es un módulo NATIVO: las compilaciones de la app hechas antes
 * de agregarlo no lo traen, e importarlo de frente las haría reventar al abrir
 * el asistente. Por eso se carga con cuidado: si no está, `vozTiquiPosible`
 * es false y el asistente habla con la voz del teléfono (expo-speech), como
 * siempre. Con la próxima compilación (npx expo run:android / EAS) ya suena
 * Tiqui.
 *
 * Si algo falla —sin red, sin llave en el servidor, el audio no arranca en
 * unos segundos— avisa con `alFallar` y quien llamó habla con la voz del
 * teléfono. Nunca se queda callado.
 * ============================================================
 */

let ExpoAudio = null;
try {
  ExpoAudio = require('expo-audio');
} catch {
  ExpoAudio = null;
}

export const vozTiquiPosible = Boolean(ExpoAudio?.createAudioPlayer);

const ESPERA_MAXIMA_MS = 5000;

let reproductor = null;
let suscripcion = null;
let turno = 0;
let modoListo = false;

const soltar = () => {
  suscripcion?.remove?.();
  suscripcion = null;
  try { reproductor?.pause?.(); } catch { /* ya estaba parado */ }
  try { reproductor?.remove?.(); } catch { /* ya estaba liberado */ }
  reproductor = null;
};

/*
 * Dice `url` (de asistenteApi.urlVoz). Devuelve una función para callarla.
 *   velocidad: 1 es normal.
 *   alTerminar: terminó bien.   alFallar: no se pudo (hablar con el teléfono).
 */
export const decirConTiqui = async (url, { velocidad = 1, alTerminar, alFallar } = {}) => {
  const miTurno = ++turno;
  const vigente = () => miTurno === turno;

  if (!vozTiquiPosible) {
    alFallar?.();
    return;
  }

  soltar();

  try {
    /*
     * Una vez: que suene aunque el iPhone esté en silencio (como expo-speech)
     * y sin dejar el micrófono tomado: el reconocedor de voz lo pide aparte
     * cada vez que empieza a escuchar.
     */
    if (!modoListo) {
      await ExpoAudio.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, interruptionMode: 'duckOthers' });
      modoListo = true;
    }
    if (!vigente()) return;

    const jugador = ExpoAudio.createAudioPlayer({ uri: url });
    reproductor = jugador;
    let empezo = false;

    const espera = setTimeout(() => {
      if (!vigente() || empezo) return;
      soltar();
      alFallar?.();
    }, ESPERA_MAXIMA_MS);

    suscripcion = jugador.addListener('playbackStatusUpdate', (estado) => {
      if (!vigente()) return;
      if (estado?.playing && !empezo) {
        empezo = true;
        clearTimeout(espera);
      }
      if (estado?.didJustFinish) {
        clearTimeout(espera);
        soltar();
        alTerminar?.();
      }
    });

    try { jugador.setPlaybackRate(velocidad); } catch { /* algunas versiones solo aceptan 1 */ }
    jugador.play();
  } catch {
    if (!vigente()) return;
    soltar();
    alFallar?.();
  }
};

// Calla lo que esté diciendo, sin avisar a nadie (interrumpir, cerrar, silenciar).
export const callarTiqui = () => {
  turno += 1;
  soltar();
};
