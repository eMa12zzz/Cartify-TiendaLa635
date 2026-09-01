/*
 * ============================================================
 * GOOGLE SIGN-IN — configuración
 * ============================================================
 * App.js importa este archivo una sola vez, solo por su efecto secundario:
 * deja a GoogleSignin listo desde antes de que cualquier pantalla intente
 * usarlo.
 *
 * El `webClientId` es el MISMO client id que ya usan frontend y backend
 * (VITE_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID) — así el idToken que entrega el
 * selector nativo trae la audiencia que el backend ya sabe verificar, sin
 * tocarlo. No es secreto: es un identificador público, pensado para viajar
 * dentro del código del cliente (ya viaja así en el bundle del frontend).
 *
 * El id de Android que pide Google Cloud (paquete + SHA-1 del keystore) NO
 * se escribe aquí: Play Services lo encuentra solo con el paquete de la app
 * en tiempo de ejecución, no hace falta pasárselo a configure().
 * ============================================================
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID =
  '148683224510-htubuika332kh2ck0f7fkc0fr06gjfjp.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});
