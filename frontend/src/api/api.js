import axios from 'axios';
import toast from 'react-hot-toast';
import { mensajeEnEspanol } from '../utils/mensajesBackend';

/*
 * ============================================================
 * CLIENTE AXIOS CENTRALIZADO — api.js
 * ============================================================
 * Axios es una librería de JavaScript para hacer peticiones HTTP
 * (como fetch, pero más potente). En lugar de escribir fetch() en
 * cada componente, creamos UNA SOLA instancia configurada aquí
 * y la importamos donde se necesite.
 *
 * ¿Por qué centralizar?
 *  - Si cambia la URL del backend, solo se cambia aquí.
 *  - Si se necesita un encabezado global (como el token JWT),
 *    se agrega una sola vez.
 *  - Los errores del servidor se manejan en un solo lugar,
 *    sin repetir código en cada componente.
 * ============================================================
 */

// 1- Creamos la instancia de Axios con la configuración base
//    `baseURL`: prefijo que se añade a todas las rutas. Ejemplo:
//    api.get('/product') equivale a GET http://localhost:4000/api/product
//    `withCredentials`: envía las cookies de sesión automáticamente en
//    cada petición (necesario para que el backend reconozca al usuario).
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/*
 * ============================================================
 * INTERCEPTORES DE RESPUESTA
 * ============================================================
 * Los interceptores son funciones que se ejecutan ANTES de que
 * la respuesta llegue al componente que hizo la petición.
 *
 *  - Interceptor de ÉXITO: recibe respuestas con status 2xx.
 *    Simplemente deja pasar la respuesta sin modificarla.
 *
 *  - Interceptor de ERROR: captura cualquier respuesta con status
 *    >= 300 (400, 401, 403, 500, etc.) o errores de red.
 *    Muestra automáticamente un toast (notificación) con el mensaje
 *    de error del servidor, sin que el componente tenga que hacerlo.
 * ============================================================
 */
api.interceptors.response.use(
    // 2- Respuesta exitosa (status 200-299): se deja pasar tal cual
    (response) => {
        return response;
    },

    // 3- Error de respuesta: se maneja de forma centralizada
    (error) => {
        // 4- Si no hay respuesta del servidor, es un error de red o conexión
        if (!error.response) {
            toast.error('Error de conexión. Verifica que el servidor backend esté encendido.');
            return Promise.reject(error);
        }

        // 5- Si sí hay respuesta, extraemos el código de estado HTTP y el mensaje
        const { status, data } = error.response;

        /*
         * 5.1- El mensaje del servidor pasa por el traductor ANTES de pintarse.
         *
         * Este es el único lugar de toda la app donde el texto que escribió el
         * backend se convierte en un aviso que ve el cliente. Por eso se
         * traduce aquí y no en cada pantalla: aunque mañana alguien agregue un
         * endpoint nuevo y se le escape un "Product not found", la tienda de
         * la 635 nunca va a mostrar inglés. Ver frontend/src/utils/mensajesBackend.js.
         *
         * Si el mensaje ya viene en español (que es lo normal hoy), el
         * traductor lo devuelve intacto y no estorba.
         */
        const mensaje = mensajeEnEspanol(data?.message, status);

        // 6- Mostramos un mensaje diferente según el tipo de error recibido
        switch (status) {
            case 400:
                // Error del cliente: datos incorrectos, campos vacíos, duplicados, etc.
                toast.error(mensaje);
                break;
            case 401:
                // No autorizado: el token expiró o no existe
                toast.error('Sesión expirada o inválida. Debes iniciar sesión.');
                break;
            case 403:
                // Prohibido: el usuario existe pero no tiene permiso para esa acción
                toast.error('Acceso denegado. No tienes permisos para esta acción.');
                break;
            case 500:
                // Error del servidor: algo falló en el backend (base de datos, etc.)
                toast.error('Error interno del servidor.');
                break;
            default:
                // Cualquier otro error no contemplado arriba (404, 409, 422...).
                // El traductor ya eligió un respaldo acorde al código, así que
                // aquí no hace falta un `||` con un texto genérico.
                toast.error(mensaje);
        }

        // 7- Rechazamos la promesa para que el catch() del componente también lo reciba
        return Promise.reject(error);
    }
);

export default api;
