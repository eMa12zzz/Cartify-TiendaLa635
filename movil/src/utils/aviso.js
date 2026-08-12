/*
 * ============================================================
 * AVISOS BREVES — aviso.js
 * ============================================================
 * La web usa `react-hot-toast` (una notificación flotante que aparece y se va
 * sola). En React Native no hay un equivalente en el núcleo, y el proyecto
 * evita agregar librerías. Lo más cercano SIN dependencias:
 *   - Android: ToastAndroid (idéntico en espíritu al toast de la web).
 *   - iOS: no hay toast nativo, así que se cae a un Alert cortito.
 *
 * Se usa donde la web llamaba a `toast.success(...)` / `toast.error(...)`: el
 * texto ya lleva el significado, así que un solo `aviso(mensaje)` alcanza.
 * ============================================================
 */
import { Platform, ToastAndroid, Alert } from 'react-native';

export const aviso = (mensaje) => {
  if (!mensaje) return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(String(mensaje), ToastAndroid.SHORT);
  } else {
    Alert.alert('', String(mensaje));
  }
};

export default aviso;
