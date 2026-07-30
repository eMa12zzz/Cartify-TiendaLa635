import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useModulos } from './useModulos';
import { flujoDeModulo } from '../utils/modulos';
import { enlaceWhatsApp, DIRECCION_EN_UNA_LINEA, NOMBRE_COMPLETO } from '../utils/tienda';

/*
 * usePieTienda — qué se puede ofrecer en el pie de página, y a dónde lleva cada
 * cosa.
 *
 * El pie es donde la gente busca lo que no encontró arriba: cómo contactar,
 * qué más vende la tienda, dónde quedó su pedido. Por eso la lista NO está
 * escrita a mano: los pasillos salen de la base igual que en el menú del
 * nombre, así que el día que abran la panadería aparece sola aquí abajo
 * también, sin que nadie se acuerde de venir a agregarla.
 *
 * La regla que gobierna todo este archivo: solo se ofrece lo que existe. Si no
 * hay WhatsApp configurado, no hay enlace de WhatsApp. Si no hay sesión, no se
 * ofrecen "Mis pedidos" —que llevaría a un login y de vuelta—, se ofrece
 * entrar. Un pie lleno de enlaces muertos es peor que un pie corto.
 */

// Lo de "Mi Cuenta" que de verdad se usa desde el pie. No están las nueve
// pantallas: el pie no es el mapa del sitio, es un atajo a lo que la gente
// busca cuando ya se cansó de buscar arriba.
const ENLACES_CUENTA = [
  { texto: 'Mis pedidos', ruta: '/mi-cuenta/pedidos' },
  { texto: 'Mis favoritos', ruta: '/mi-cuenta/favoritos' },
  { texto: 'Mis puntos', ruta: '/mi-cuenta/puntos' },
  { texto: 'Mis direcciones', ruta: '/mi-cuenta/direcciones' },
  { texto: 'Centro de ayuda', ruta: '/mi-cuenta/ayuda' },
];

const ENLACES_SIN_SESION = [
  { texto: 'Iniciar sesión', ruta: '/iniciar-sesion' },
  { texto: 'Crear una cuenta', ruta: '/register' },
];

const SALUDO_WHATSAPP =
  'Hola, vengo de la tienda en linea y quisiera hacer una consulta.';

export const usePieTienda = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { modulos } = useModulos();

  /*
   * Los pasillos que se recorren dentro de la tienda llevan a la portada con
   * ese pasillo puesto (?modulo=...). Impresiones tiene pantalla propia, así
   * que lleva a la suya. Es la misma regla del menú del nombre de la tienda:
   * si aquí dijera otra cosa, el mismo pasillo se comportaría distinto según
   * desde dónde se toque.
   */
  const pasillos = useMemo(
    () =>
      (modulos || []).map((m) => ({
        id: m._id,
        texto: m.name,
        ruta:
          flujoDeModulo(m) === 'impresiones'
            ? '/impresiones'
            : `/?modulo=${encodeURIComponent(m._id)}`,
      })),
    [modulos]
  );

  const enlacesCuenta = isAuthenticated ? ENLACES_CUENTA : ENLACES_SIN_SESION;

  /*
   * Navegar Y subir hasta arriba.
   *
   * Sin el scroll, tocar un enlace del pie deja al cliente en la pantalla nueva
   * pero a la altura donde venía —o sea, mirando el pie otra vez—. Parece que
   * el enlace no hizo nada.
   */
  const ir = (ruta) => {
    navigate(ruta);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    pasillos,
    enlacesCuenta,
    ir,
    whatsapp: enlaceWhatsApp(SALUDO_WHATSAPP),
    direccion: DIRECCION_EN_UNA_LINEA,
    nombre: NOMBRE_COMPLETO,
    // El año se calcula, no se escribe: un "© 2026" clavado en el código
    // envejece solo y delata que a la tienda nadie la cuida.
    anio: new Date().getFullYear(),
  };
};
