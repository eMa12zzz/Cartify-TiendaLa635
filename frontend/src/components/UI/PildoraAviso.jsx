import { resolveValue } from 'react-hot-toast';
import { ICONOS, iconoConEmoji } from '../../utils/iconosAviso';

/*
 * ============================================================
 * LA PÍLDORA DE LOS AVISOS — PildoraAviso.jsx
 * ============================================================
 * Todos los avisos de la web salen con la misma cara: la píldora oscura con
 * un círculo de color a la izquierda, abajo al centro, la de la landing page.
 * Antes solo "agregado al carrito" se veía así; quitar algo del carrito,
 * guardar un favorito o un error salían como una tarjeta blanca arriba a la
 * derecha, y parecían avisos de dos aplicaciones distintas.
 *
 * El <Toaster> de App.jsx dibuja con esto cada aviso que llega por
 * `toast()`, `toast.success()` o `toast.error()`: nadie tiene que acordarse
 * de pedir la píldora, basta con avisar como siempre. El icono de cada tipo y
 * los que se pasan a mano están en utils/iconosAviso.jsx.
 *
 * El COLOR de la píldora no está aquí: sale de --aviso-fondo y --aviso-texto,
 * que el Toaster pone según dónde está la persona (ver useEstiloAvisos). En
 * la tienda es la tinta de la marca; en el panel, la paleta de accesibilidad
 * al revés, para que en Alto Contraste siga leyéndose.
 *
 * La entrada y la salida (rebote desde abajo, hundirse al irse) están en
 * index.css: .aviso-entra / .aviso-sale.
 * ============================================================
 */

const iconoDe = (t) => {
  if (typeof t.icon === 'string') return iconoConEmoji(t.icon);
  if (t.icon) return t.icon;
  if (t.type === 'success') return ICONOS.exito;
  if (t.type === 'error') return ICONOS.error;
  if (t.type === 'loading') return ICONOS.cargando;
  return ICONOS.info;
};

const PildoraAviso = ({ t }) => (
  <div
    {...t.ariaProps}
    className={t.visible ? 'aviso-entra' : 'aviso-sale'}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 18px 10px 10px',
      // 22 es la mitad de la píldora de una línea: con una línea es cápsula,
      // con dos (un mensaje largo) queda un rectángulo redondeado.
      borderRadius: 22,
      background: 'var(--aviso-fondo, #1C1614)',
      color: 'var(--aviso-texto, #fff)',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.35,
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
      maxWidth: 'min(92vw, 440px)',
    }}
  >
    {iconoDe(t)}
    <span style={{ minWidth: 0, overflowWrap: 'anywhere', textWrap: 'pretty' }}>{resolveValue(t.message, t)}</span>
  </div>
);

export default PildoraAviso;
