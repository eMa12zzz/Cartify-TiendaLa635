import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { URL_API } from '../api/api';
import configuracion from '../../app.json';

/*
 * ============================================================
 * AVISAR QUE ALGO FALLÓ — reportarError.js (app)
 * ============================================================
 * Lo mismo que frontend/src/utils/reportarError.js: manda el error al
 * servidor (POST /api/errores), que lo agrupa, lo muestra en el panel
 * (Sistema → Errores) y le avisa por correo al administrador.
 *
 *   - Solo en una APK de verdad: con Metro abierto ya se ve en la consola.
 *   - Cada error una vez por sesión, y como mucho 10.
 *   - Sin datos de la persona: qué falló, en qué pantalla, en qué versión
 *     (y en qué actualización por internet, que es lo que más importa para
 *     saber si un arreglo llegó) y en qué sistema.
 * ============================================================
 */

const MAXIMO_POR_SESION = 10;
const enviados = new Set();

// "1.0.0 · production · a1b2c3d4": la versión de la APK, el canal y la actualización que corre.
const versionActual = () => {
  try {
    const actualizacion = Updates.updateId ? Updates.updateId.slice(0, 8) : 'sin actualizar';
    return [configuracion.expo.version, Updates.channel, actualizacion].filter(Boolean).join(' · ');
  } catch {
    return configuracion.expo.version;
  }
};

export const reportarError = (error, { donde = '', extra = '' } = {}) => {
  try {
    if (__DEV__) return;
    const mensaje = String(error?.message || error || '').slice(0, 500);
    if (!mensaje) return;
    const clave = `${mensaje}|${donde}`;
    if (enviados.has(clave) || enviados.size >= MAXIMO_POR_SESION) return;
    enviados.add(clave);

    fetch(`${URL_API}/errores`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        origen: 'app',
        mensaje,
        pila: [String(error?.stack || ''), extra].filter(Boolean).join('\n').slice(0, 4000),
        donde,
        version: versionActual(),
        dispositivo: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`,
      }),
    }).catch(() => {});
  } catch {
    // Avisar de un error jamás puede causar otro.
  }
};

/*
 * Lo que se escapa de todas las pantallas: el manejador global de React
 * Native. Se anota y después se le pasa al de siempre, que es el que decide
 * qué hacer (en una APK, cerrar la app si el error es fatal).
 */
export const escucharErroresSueltos = () => {
  const anterior = global.ErrorUtils?.getGlobalHandler?.();
  global.ErrorUtils?.setGlobalHandler?.((error, fatal) => {
    reportarError(error, { donde: fatal ? 'error fatal' : 'error suelto' });
    anterior?.(error, fatal);
  });
};
