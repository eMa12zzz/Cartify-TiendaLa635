/*
 * ============================================================
 * TIQUI DEL ADMINISTRADOR — tiquiAdminApi.js
 * ============================================================
 * Lo que habla la app cuando entra el administrador: su inicio de sesión (el
 * mismo del panel web, con el código que llega al correo) y Tiqui del panel
 * (/api/tiqui-panel), la asistente del equipo. Es OTRA asistente que la de
 * la tienda (asistenteApi): no comparten sesión ni charla.
 *
 * El token del administrador va en cada llamada, a mano, y NO se instala como
 * el token de la app (establecerToken): ese es el del cliente, y mezclarlos
 * haría que la tienda hablara con el servidor como si fuera el dueño.
 * ============================================================
 */

import { peticion, URL_API } from './api';

const conToken = (token) => ({ Authorization: `Bearer ${token}` });

/*
 * Por qué no se pudo, dicho para Tiqui: 'sesion' cierra el modo administrador;
 * 'lento' es el servidor de Render despertándose (se duerme sin tráfico y la
 * primera pregunta puede tardar medio minuto), que no es culpa del internet.
 */
const origenDe = (error) =>
  error?.estado === 401 ? 'sesion'
    : error?.estado === 429 ? 'tope'
    : error?.estado === 0 && /tard/.test(error?.message || '') ? 'lento'
    : 'sin-red';

// Lo que se le aguanta al servidor: si está despertando, tarda más que la IA.
const ESPERA_MS = 30000;

export const tiquiAdminApi = {
  /*
   * Paso 1: correo y contraseña. El servidor manda un código al correo y, como
   * la app no guarda cookies como el navegador, devuelve el token del paso 2
   * (`app: true`). Ese token no trae el código, solo su huella.
   */
  entrar: ({ email, password }) =>
    peticion('/loginAdmin/login', { metodo: 'POST', cuerpo: { email, password, app: true }, tiempoMaximo: 45000 }),

  // Paso 2: el código del correo. Devuelve { token, tipo, admin }.
  verificar: ({ code, twofaToken }) =>
    peticion('/loginAdmin/verify-2fa', { metodo: 'POST', cuerpo: { code, twofaToken } }),

  /*
   * Al salir se le pide al servidor que borre la cookie de sesión del personal
   * que el teléfono guardó al entrar: si se quedara, la tienda la seguiría
   * mandando en cada llamada.
   */
  salir: () => peticion('/logoutAdmin', { metodo: 'POST' }).catch(() => null),

  despertar: async (token) => {
    try {
      const datos = await peticion('/tiqui-panel/listo', { cabeceras: conToken(token), tiempoMaximo: 45000 });
      return { voz: Boolean(datos?.voz) };
    } catch (error) {
      return { voz: false, origen: origenDe(error) };
    }
  },

  // pantalla 'app': el servidor sabe que aquí no hay pantallas del panel que abrir.
  conversar: async (token, { frase, historial }) => {
    try {
      return await peticion('/tiqui-panel', {
        metodo: 'POST',
        cuerpo: { frase, historial, pantalla: 'app' },
        cabeceras: conToken(token),
        tiempoMaximo: ESPERA_MS,
      });
    } catch (error) {
      return { acciones: [], respuesta: '', entendido: false, origen: origenDe(error) };
    }
  },

  confirmar: async (token, propuesta) => {
    try {
      return await peticion('/tiqui-panel/confirmar', {
        metodo: 'POST',
        cuerpo: { token: propuesta },
        cabeceras: conToken(token),
        tiempoMaximo: ESPERA_MS,
      });
    } catch (error) {
      return { ok: false, respuesta: '', origen: origenDe(error) };
    }
  },

  // La voz es la misma de la tienda: convertir texto en audio no sabe de ninguna asistente.
  urlVoz: (texto) => `${URL_API}/ai/voz?t=${encodeURIComponent(texto)}`,
};

export default tiquiAdminApi;
