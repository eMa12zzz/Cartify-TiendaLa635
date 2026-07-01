import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor global para respuestas y errores
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (!error.response) {
            toast.error('Error de conexión. Verifica que el servidor backend esté encendido.', {
                style: { background: '#ff4b4b', color: '#fff' }
            });
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        switch (status) {
            case 400:
                toast.error(data?.message || 'Petición incorrecta o datos faltantes.', {
                    style: { background: '#ff4b4b', color: '#fff' }
                });
                break;
            case 401:
                toast.error('Sesión expirada o inválida. Debes iniciar sesión.', {
                    style: { background: '#ff4b4b', color: '#fff' }
                });
                break;
            case 403:
                toast.error('Acceso denegado. No tienes permisos para esta acción.', {
                    style: { background: '#ff4b4b', color: '#fff' }
                });
                break;
            case 500:
                toast.error('Error interno del servidor.', {
                    style: { background: '#ff4b4b', color: '#fff' }
                });
                break;
            default:
                toast.error(data?.message || 'Ha ocurrido un error inesperado.', {
                    style: { background: '#ff4b4b', color: '#fff' }
                });
        }

        return Promise.reject(error);
    }
);

export default api;
