import logoTienda from '../../assets/logo-tienda.png';

/*
 * LogoMarca — el sello de la tienda en el panel: la placa navy con el tag y
 * "Tienda la 635".
 *
 * ANTES esto se armaba con CSS (un <div> + el ícono Tag de lucide + texto),
 * y por eso era DINÁMICO: el fondo seguía var(--theme-primary) —la paleta
 * activa, incluidas las de alto contraste— y el texto leía el nombre de
 * Personalización, así que si el dueño renombraba su tienda el sello se
 * actualizaba solo.
 *
 * Con el archivo real de diseño eso se pierde: es un PNG fijo, con "Tienda
 * la 635" ya quemado en los píxeles. El fondo no cambia con la paleta y el
 * nombre no sigue a Personalización — si algún día el dueño renombra la
 * tienda, hay que exportar un logo nuevo y reemplazar este archivo a mano.
 * Es una decisión pedida a propósito, no un descuido: la placa CSS de antes
 * era justamente el primer intento que se había descartado por no lograr la
 * forma del tag en puro CSS sin que saliera una flor en vez de una etiqueta.
 */
const LogoMarca = ({ height = 44 }) => (
  <img
    src={logoTienda}
    alt="Tienda la 635"
    className="flex-none rounded-2xl"
    style={{ height, width: 'auto' }}
  />
);

export default LogoMarca;
