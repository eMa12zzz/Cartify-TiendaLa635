import { useSyncExternalStore } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { areaDeRuta } from '../../utils/sesion';
import { aceptoAnaliticas, leerConsentimiento, suscribirConsentimiento } from '../../utils/consentimiento';

/*
 * ============================================================
 * ANALÍTICAS — AnaliticasTienda.jsx
 * ============================================================
 * Vercel Web Analytics: cuántas visitas tiene cada página, sin cookies y sin
 * saber quién es nadie. Se carga SOLO si la persona lo aceptó en el aviso de
 * cookies (utils/consentimiento.js), y se activa en el panel de Vercel
 * (proyecto → Analytics → Enable).
 *
 * Antes de mandar cada visita se limpia la dirección:
 *   - Sin lo que va después del "?": ahí viajan búsquedas (?q=...), destinos
 *     de login (?volver=...) y códigos que no le importan a nadie contar.
 *   - Los tramos que identifican algo se vuelven un comodín: un pedido
 *     (/mi-cuenta/pedido/[id]) o el código de un kiosco (/vincular/[codigo]).
 *     Así se cuentan juntas todas las visitas a "ver un pedido", sin mandar
 *     el número de nadie.
 *   - El panel del personal no se mide.
 * Y se vuelve a mirar el permiso antes de CADA envío: si la persona lo
 * retiró, no sale nada más, sin tener que recargar.
 * ============================================================
 */

const RUTAS_CON_ID = [
  [/^\/mi-cuenta\/pedido\/[^/]+/, '/mi-cuenta/pedido/[id]'],
  [/^\/vincular\/[^/]+/, '/vincular/[codigo]'],
];

const limpiar = (evento) => {
  if (!aceptoAnaliticas()) return null;
  try {
    const url = new URL(evento.url);
    if (areaDeRuta(url.pathname) === 'personal') return null;
    let ruta = url.pathname;
    for (const [patron, comodin] of RUTAS_CON_ID) ruta = ruta.replace(patron, comodin);
    return { ...evento, url: `${url.origin}${ruta}` };
  } catch {
    return null;
  }
};

const AnaliticasTienda = () => {
  const consentimiento = useSyncExternalStore(suscribirConsentimiento, leerConsentimiento, () => null);
  if (!consentimiento?.analiticas) return null;
  return <Analytics beforeSend={limpiar} />;
};

export default AnaliticasTienda;
