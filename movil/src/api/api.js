/*
 * ============================================================
 * CLIENTE HTTP — api.js
 * ============================================================
 * El equivalente móvil de `frontend/src/api/api.js`, pero con `fetch` en vez
 * de axios. No es una limitación: el authApi de la web ya usa `fetch` pelado
 * para las rutas de sesión, y React Native lo trae de fábrica. Traer axios
 * seria una dependencia mas para hacer exactamente lo mismo.
 *
 * ── La dirección del backend ──
 *
 * Esta es la parte que en móvil no se parece en nada a la web y donde se
 * atasca todo el mundo: "localhost" dentro del emulador de Android NO es la
 * computadora, es el propio teléfono virtual. El backend en localhost:4000
 * queda invisible.
 *
 * El emulador llega a la computadora por la dirección especial 10.0.2.2, que
 * es la que se usa por defecto. En un teléfono de verdad conectado por WiFi no
 * sirve ninguna de las dos: hay que poner la IP de la computadora en la red
 * (la que Expo muestra al arrancar, tipo 192.168.1.23) en HOST_MANUAL.
 * ============================================================
 */

import { Platform } from 'react-native';

/*
 * Para probar en un teléfono físico: escriba aquí la IP de su computadora.
 * Ejemplo: const HOST_MANUAL = 'http://192.168.1.23:4000/api';
 */
const HOST_MANUAL = null;

const HOST_POR_DEFECTO = Platform.select({
  android: 'http://10.0.2.2:4000/api', // el emulador ve la PC en esta direccion
  ios: 'http://localhost:4000/api',
  default: 'http://localhost:4000/api',
});

export const URL_API = HOST_MANUAL || HOST_POR_DEFECTO;

/*
 * Un error que ya trae el mensaje que va a leer el cliente.
 *
 * El backend contesta en español ("El correo o contraseña son incorrectos",
 * "Ya existe una cuenta con ese correo"), así que aquí no hace falta el
 * traductor que tiene la web: se muestra tal cual y solo se inventa un texto
 * cuando el servidor no dijo nada.
 */
export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

const RESPALDO_POR_ESTADO = {
  400: 'Revise los datos e intente de nuevo',
  401: 'El correo o contraseña son incorrectos',
  403: 'No tiene permiso para hacer esto',
  404: 'No encontramos lo que buscaba',
  500: 'Error interno del servidor',
};

/*
 * Una petición al backend. Devuelve el JSON ya parseado, o lanza un ErrorApi
 * con el mensaje del servidor.
 *
 * El "error de conexión" merece su propio texto porque en desarrollo es el que
 * más se ve, y decir "algo salió mal" cuando lo que pasa es que el backend
 * está apagado hace perder media hora buscando el error en el lugar
 * equivocado.
 */
export const peticion = async (ruta, { metodo = 'GET', cuerpo, cabeceras } = {}) => {
  let respuesta;

  // Un FormData (la foto de perfil) va tal cual: ni se convierte a JSON ni se
  // le pone Content-Type a mano, que si no fetch no agrega el boundary del
  // multipart y el backend no puede separar los campos.
  const esFormData = cuerpo instanceof FormData;

  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(cuerpo && !esFormData ? { 'Content-Type': 'application/json' } : {}),
        ...cabeceras,
      },
      body: esFormData ? cuerpo : cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(
      `No se pudo conectar con el servidor (${URL_API}). Revise que el backend esté encendido.`,
      0
    );
  }

  // Un 500 puede devolver HTML en vez de JSON; que eso no tumbe la pantalla.
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const mensaje =
      datos?.message || RESPALDO_POR_ESTADO[respuesta.status] || 'Ocurrió un error inesperado';
    throw new ErrorApi(mensaje, respuesta.status);
  }

  return datos;
};

export default peticion;
