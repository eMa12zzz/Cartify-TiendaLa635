/*
 * ============================================================
 * SERVICIOS DE API — authApi.js
 * ============================================================
 * Este archivo contiene las funciones que se comunican con las
 * rutas de autenticación del backend.
 *
 * Diferencia con los demás servicios:
 *  - Estas funciones usan `fetch` nativo porque se llaman ANTES
 *    de tener sesión (no hay token aún que enviar).
 *  - Los demás servicios usan la instancia de Axios (api.js)
 *    que ya tiene el baseURL y los interceptores configurados.
 *
 * ── `credentials: 'include'` NO ES OPCIONAL AQUÍ ──
 *
 * Sin él, el navegador DESCARTA la cookie de sesión que manda el servidor en
 * la respuesta del login. El frontend vive en el puerto 5173 y el backend en
 * el 4000: son orígenes distintos, y en una petición cruzada el `Set-Cookie`
 * se ignora salvo que se pida explícitamente.
 *
 * Faltaba, y durante meses no se notó porque ninguna ruta leía cookies: la
 * sesión vivía solo en localStorage y la app funcionaba igual. El día que la
 * API empezó a exigir sesión de verdad, el login pasó a "funcionar" —guardaba
 * el localStorage— y acto seguido todo devolvía 401, así que la persona
 * entraba y rebotaba de vuelta al login.
 *
 * Va en las CUATRO: cliente, administrador y los dos pasos del 2FA del
 * personal. Cada una deja su propia cookie.
 * ============================================================
 */

// 1- Paso 1 del login de empleados (2FA): envía correo/usuario para recibir OTP
export const loginStep1 = async (data) => {
  const response = await fetch('http://localhost:4000/api/authFlow/login-step-1', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error en login');
  }
  return response.json();
};

// 2- Paso 2 del login de empleados (2FA): valida el código OTP y devuelve el token final
export const loginStep2 = async (data) => {
  const response = await fetch('http://localhost:4000/api/authFlow/login-step-2', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error al verificar');
  }
  return response.json();
};

// 3- Login de administradores: valida correo y contraseña directamente (sin OTP)
export const loginAdminDB = async (data) => {
  const response = await fetch('http://localhost:4000/api/loginAdmin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error en inicio de sesión de admin');
  }
  return response.json();
};

// 4- Login de clientes: valida correo y contraseña. Requiere cuenta verificada y activa.
export const loginClientDB = async (data) => {
  const response = await fetch('http://localhost:4000/api/loginClient/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error en inicio de sesión de cliente');
  }
  return response.json();
};

// 5- Login de clientes con Google. `credential` es el ID token que devuelve el
// botón de Google; el backend lo verifica y crea/enlaza la cuenta. Misma cookie
// y misma forma de respuesta que loginClientDB.
/*
 * `extra` lleva el consentimiento y el teléfono, y SOLO lo manda la pantalla de
 * Registro. Entrar con una cuenta que ya existe no vuelve a pedir nada; crear
 * una nueva sí, porque Google prueba quién es la persona pero no que haya
 * aceptado los términos. Ver googleAuthClient.js en el backend.
 */
export const googleLoginDB = async (credential, extra = {}) => {
  const response = await fetch('http://localhost:4000/api/loginClient/google', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, ...extra }),
  });
  if (!response.ok) {
    const err = await response.json();
    const error = new Error(err.message || 'No se pudo iniciar sesión con Google');
    /*
     * El detalle viaja PEGADO al error y no se pierde: cuando el servidor
     * responde "esta cuenta es nueva y falta el consentimiento", la pantalla
     * de login necesita saberlo para llevar a registrarse en vez de dejar un
     * aviso rojo que no dice qué hacer.
     */
    error.requiereConsentimiento = !!err.requiereConsentimiento;
    error.sugerido = err.sugerido || null;
    throw error;
  }
  return response.json();
};