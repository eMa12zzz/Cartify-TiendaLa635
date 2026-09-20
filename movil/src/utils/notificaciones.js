/*
 * ============================================================
 * AVISOS DEL TELÉFONO — notificaciones.js
 * ============================================================
 * Lo que convierte los tres interruptores de Mi cuenta > Notificaciones en
 * avisos que de verdad suenan. Hasta ahora eran una preferencia guardada en
 * la cuenta que nadie leía desde el teléfono: el backend mandaba correos y el
 * teléfono no se enteraba de nada (ver la cabecera de pages/cuenta/Notificaciones.js).
 *
 * El reparto de tareas es el mismo que en la web:
 *   - Las preferencias (QUÉ avisos) viven en la cuenta y se editan en esa
 *     pantalla.
 *   - El token (A DÓNDE mandarlos) vive en esta instalación de la app y se
 *     registra aquí.
 * El backend cruza las dos cosas en utils/pushExpo.js.
 *
 * ── Hace falta un projectId, y sin él esto no promete nada ──
 *
 * `getExpoPushTokenAsync` necesita el id del proyecto de Expo para emitir un
 * token. Sale de `EXPO_PUBLIC_EAS_PROJECT_ID` (ver .env.example), igual que el
 * WhatsApp sale de su variable: sin configurar, `registrarParaAvisos` devuelve
 * null y quien lo llama no enciende nada. Mismo criterio que utils/tienda.js
 * —prometer avisos que no van a llegar es peor que no ofrecerlos— y la misma
 * razón por la que la pantalla avisa en vez de quedarse callada.
 *
 * ── El emulador no recibe push ──
 *
 * Los avisos remotos necesitan un aparato de verdad: `Device.isDevice` es
 * false en el emulador de Android Studio y ahí Expo ni siquiera emite token.
 * No es un error que haya que esconder, es lo que hay que decirle a quien
 * está probando.
 *
 * ── Android exige canal ──
 *
 * Sin un canal creado, Android 8+ manda los avisos a uno por defecto, sin
 * sonido ni vibración, y nadie se entera. El canal se llama "avisos" y es el
 * mismo nombre que manda el backend en cada mensaje (`channelId`): si los dos
 * lados no dicen lo mismo, el aviso llega mudo.
 * ============================================================
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

/*
 * Qué hacer con un aviso que llega con la app ABIERTA. Por defecto Android no
 * lo muestra —asume que si está mirando la app ya se enteró—, y eso deja fuera
 * el caso que importa: alguien viendo el catálogo cuando su pedido sale.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/*
 * El id del proyecto de Expo. Se busca primero en app.json (donde lo deja
 * `eas init`) y si no, en la variable de entorno — así funciona tanto en un
 * proyecto ya enlazado con EAS como en uno que solo tiene el .env.
 */
export const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ||
  Constants?.easConfig?.projectId ||
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  '';

export const HAY_PUSH = !!PROJECT_ID;

const CANAL = 'avisos';

/*
 * El canal de Android, con la pinta de la tienda: la luz del aviso en azul
 * marino, como todo lo demás.
 */
const prepararCanal = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Avisos de la tienda',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#012D45',
  });
};

/*
 * Pide el permiso (solo si no lo tiene ya) y devuelve el token de Expo, o null
 * con el motivo. Nunca lanza: quien lo llama está en medio de un interruptor,
 * no en un try grande.
 *
 * Los motivos son para mostrar, no para depurar: cada uno se convierte en una
 * frase distinta en la pantalla, porque "no se pudo" no le dice a nadie si
 * tiene que ir a los ajustes del teléfono o si simplemente está en un
 * emulador.
 */
export const registrarParaAvisos = async () => {
  if (!HAY_PUSH) return { token: null, motivo: 'sin-proyecto' };
  if (!Device.isDevice) return { token: null, motivo: 'emulador' };

  try {
    await prepararCanal();

    const { status: yaEstaba } = await Notifications.getPermissionsAsync();
    let status = yaEstaba;

    /*
     * Solo se pregunta si nunca se decidió. Volver a pedir un permiso ya
     * denegado no abre nada en Android: devuelve "denied" en el acto, y la
     * pantalla tiene que mandar a los ajustes del sistema en vez de insistir.
     */
    if (status !== 'granted') {
      const { status: pedido } = await Notifications.requestPermissionsAsync();
      status = pedido;
    }

    if (status !== 'granted') return { token: null, motivo: 'sin-permiso' };

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    return { token: data || null, motivo: data ? null : 'sin-token' };
  } catch (error) {
    console.log('avisos: no se pudo registrar el teléfono: ' + error?.message);
    return { token: null, motivo: 'error' };
  }
};

/*
 * El token que ya tiene este teléfono, sin pedir permiso ni molestar a nadie.
 * Sirve para dar de baja al cerrar sesión: ahí no se puede pedir permiso
 * (sería absurdo) pero sí hay que decirle al backend que deje de avisar aquí.
 */
export const tokenActual = async () => {
  if (!HAY_PUSH || !Device.isDevice) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    // El canal va antes del token también aquí: de Android 13 en adelante,
    // pedirlo sin canal creado no devuelve nada.
    await prepararCanal();
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    return data || null;
  } catch {
    return null;
  }
};

/*
 * Qué hacer cuando alguien TOCA el aviso. El backend manda en `data` el tipo y
 * el id (ver pushExpo.js), y esto lo traduce a la pantalla que corresponde.
 *
 * Devuelve la función de limpieza de los dos oyentes, para el useEffect que lo
 * use: sin quitarlos, cada recarga en caliente deja uno más escuchando y un
 * solo toque abre la pantalla tres veces.
 */
export const escucharToques = (alTocar) => {
  const sub = Notifications.addNotificationResponseReceivedListener((respuesta) => {
    const datos = respuesta?.notification?.request?.content?.data || {};
    alTocar(datos);
  });

  /*
   * El caso de la app cerrada del todo: el toque que la abrió no pasa por el
   * oyente de arriba —ya había ocurrido antes de que existiera— y hay que ir a
   * buscarlo. Sin esto, abrir la app desde el aviso te deja en la portada.
   */
  Notifications.getLastNotificationResponseAsync().then((respuesta) => {
    if (!respuesta) return;
    alTocar(respuesta?.notification?.request?.content?.data || {});
  });

  return () => sub.remove();
};
