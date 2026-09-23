import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { areaDeRuta } from '../../utils/sesion';
import Mascota from './Mascota';

/*
 * ============================================================
 * AVISO SIN CONEXIÓN — AvisoSinConexion.jsx
 * ============================================================
 * Antes, si se caía el internet, la tienda no decía nada: los botones dejaban
 * de responder o aparecían errores sueltos, y no había forma de saber si era
 * la tienda o la conexión. Ahora, apenas el navegador avisa que no hay red,
 * sale la mascota con el cordón desenchufado y se aclara que el carrito no se
 * pierde (vive en el navegador; ver useStore).
 *
 * Cuando vuelve la conexión se dice un momento que ya se puede seguir, y el
 * aviso se va solo. No hay botón de reintentar: el navegador avisa por su
 * cuenta cuando la red regresa.
 *
 * Solo en la tienda y Mi Cuenta. El panel tiene su propio manejo de errores y
 * otra paleta; la frontera es la misma de utils/sesion.js.
 * ============================================================
 */

const MS_DE_VUELTA = 2400;

const AvisoSinConexion = () => {
  const { pathname } = useLocation();
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [deVuelta, setDeVuelta] = useState(false);

  useEffect(() => {
    let reloj = null;
    const alCaer = () => {
      clearTimeout(reloj);
      setDeVuelta(false);
      setEnLinea(false);
    };
    const alVolver = () => {
      setEnLinea(true);
      setDeVuelta(true);
      reloj = setTimeout(() => setDeVuelta(false), MS_DE_VUELTA);
    };
    window.addEventListener('offline', alCaer);
    window.addEventListener('online', alVolver);
    return () => {
      window.removeEventListener('offline', alCaer);
      window.removeEventListener('online', alVolver);
      clearTimeout(reloj);
    };
  }, []);

  if (areaDeRuta(pathname) === 'personal') return null;
  if (enLinea && !deVuelta) return null;

  return (
    <div className="aviso-conexion" role="status" aria-live="polite">
      <Mascota pose={enLinea ? 'saludo' : 'sin-conexion'} alto={58} />
      <div className="aviso-conexion-texto">
        <strong>{enLinea ? 'Volvió la conexión' : 'Sin conexión'}</strong>
        <span>{enLinea ? 'Ya puedes seguir comprando.' : 'Revisa tu internet. Tu carrito queda guardado.'}</span>
      </div>
    </div>
  );
};

export default AvisoSinConexion;
