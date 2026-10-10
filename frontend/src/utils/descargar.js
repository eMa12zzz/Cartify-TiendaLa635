import api from '../api/api';
import { enLaApp } from './puenteApp';

/*
 * ============================================================
 * BAJAR UN ARCHIVO — descargar.js
 * ============================================================
 * Los reportes del panel (el PDF del Dashboard, el inventario, el
 * recordatorio del calendario) se arman aquí, en el navegador.
 *
 *   - En un navegador, se bajan como siempre: un enlace a un blob con
 *     `download` y un clic.
 *   - Dentro de la app del teléfono (el panel abierto en el WebView de la app,
 *     ver movil/src/pages/personal/PanelWeb.js) eso no hace nada: Android solo
 *     descarga direcciones de internet. Ahí el archivo se sube un momento al
 *     servidor y se navega a una dirección de un solo rato; la app le pasa la
 *     descarga al gestor de Android, que lo guarda en Descargas. Ver
 *     backend/src/utils/descargasPanel.js.
 * ============================================================
 */

const bajarEnElNavegador = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Se libera un momento después, cuando ya arrancó la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const descargarArchivo = async (blob, nombre) => {
  if (!enLaApp()) {
    bajarEnElNavegador(blob, nombre);
    return;
  }
  const { data } = await api.post(`/descargas?nombre=${encodeURIComponent(nombre)}`, blob, {
    headers: { 'Content-Type': blob.type || 'application/pdf' },
  });
  window.location.assign(`${api.defaults.baseURL}/descargas/${data.clave}/${encodeURIComponent(nombre)}`);
};
