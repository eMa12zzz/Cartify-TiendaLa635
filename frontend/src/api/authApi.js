import api from './api';

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
 * ============================================================
 */

// 1- Paso 1 del login de empleados (2FA): envía correo/usuario para recibir OTP
export const loginStep1 = async (data) => {
  const response = await fetch('http://localhost:4000/api/authFlow/login-step-1', {
    method: 'POST',
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error en inicio de sesión de cliente');
  }
  return response.json();
};