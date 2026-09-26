import toast from 'react-hot-toast';
import { ICONOS } from './iconosAviso';

/*
 * ============================================================
 * AVISOS DEL CARRITO — avisoCarrito.jsx
 * ============================================================
 * Agregar y quitar del carrito. Salen con la píldora de todos los avisos
 * (components/UI/PildoraAviso.jsx), abajo al centro: ahí no tapan el botón
 * del carrito al que la foto va volando y quedan cerca del pulgar en el
 * teléfono.
 *
 * Los dos usan el MISMO id: tocar "+" cinco veces actualiza la píldora que ya
 * está en pantalla ("3 en el carrito", "4 en el carrito"...) en vez de apilar
 * cinco avisos, y agregar algo y quitarlo enseguida cambia el mensaje de la
 * misma píldora en vez de dejar dos que se contradicen.
 * ============================================================
 */

const ID = 'carrito';
const DURACION = 2200;

export const avisarAgregado = (texto) => toast.success(texto, { id: ID, duration: DURACION });

export const avisarQuitado = (texto) => toast(texto, { id: ID, duration: DURACION, icon: ICONOS.quitar });

export default avisarAgregado;
