import { ShieldCheck, Store as StoreFront, Bike } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';

/*
 * ============================================================
 * EL CÓDIGO DE ENTREGA — CodigoEntrega.jsx
 * ============================================================
 * Los cuatro dígitos que el cliente dicta al recibir su pedido.
 *
 * POR QUÉ EXISTE
 * Entregar era cuestión de fe: el repartidor llegaba a un portón, alguien salía
 * y decía "sí, es mío", y listo. En el mostrador, igual. Nada distinguía al
 * cliente que pagó de un vecino que oyó el timbre — ni protegía al repartidor
 * el día que alguien reclame que nunca recibió nada.
 *
 * QUIÉN LO VE
 * Solo el cliente, y solo en SU pedido. El personal NO lo tiene en pantalla a
 * propósito: si lo viera, podría marcar "entregado" desde la moto sin
 * preguntarle nada a nadie, y el código dejaría de probar lo único que tiene
 * que probar. Ver sinCodigoDeEntrega en el controlador de pedidos.
 *
 * CUÁNDO SE PINTA
 * Mientras el pedido está en curso. Un pedido ya entregado o cancelado no
 * necesita código, y dejarlo ahí invita a dictarlo cuando ya no toca. El
 * backend lo emite para TODOS los pedidos, sean de domicilio o de retiro: el
 * mostrador también entrega a quien se presente.
 * ============================================================
 */
const CodigoEntrega = ({ codigo, deliveryType, estado, compacto = false }) => {
  const { palette } = useTheme();
  const c = palette.colors;

  /*
   * Sin código no se pinta nada. Pasa en los pedidos anteriores a esta función,
   * que se quedaron sin uno: mejor que no aparezca la tarjeta a que aparezca
   * vacía y el cliente crea que se le perdió algo.
   */
  if (!codigo) return null;

  // Ya entregado o cancelado: el código cumplió (o ya no aplica).
  if (estado === 'entregado' || estado === 'cancelado') return null;

  const esDomicilio = deliveryType === 'delivery';
  const Icono = esDomicilio ? Bike : StoreFront;

  const explicacion = esDomicilio
    ? 'Dígaselos a quien le entregue el pedido en la puerta.'
    : 'Dígaselos en el mostrador al recoger su pedido.';

  // Los dígitos, separados. Un "0451" de corrido se lee mal en un teléfono a
  // contraluz; separados se dictan de un vistazo.
  const digitos = String(codigo).split('');

  if (compacto) {
    return (
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--marca-600)' }} />
        <span className="text-xs" style={{ color: c.textMuted }}>Código de entrega</span>
        <span
          className="text-sm font-bold tracking-[0.2em]"
          style={{ color: c.textPrimary }}
        >
          {codigo}
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-6 rounded-2xl p-4"
      style={{
        border: `1px solid ${c.cardBorder}`,
        // Un fondo apenas distinto del resto de la tarjeta: tiene que saltar a
        // la vista sin gritar como si fuera un error.
        background: 'color-mix(in srgb, var(--marca-600) 6%, transparent)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--marca-600)' }} />
        <span className="text-sm font-bold" style={{ color: c.textPrimary }}>
          Su código de entrega
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {digitos.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-xl text-2xl font-bold"
            style={{
              width: 46,
              height: 56,
              color: c.textPrimary,
              background: c.cardBg,
              border: `1px solid ${c.cardBorder}`,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <Icono className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: c.textMuted }} />
        <p className="text-xs leading-relaxed" style={{ color: c.textSecondary }}>
          {explicacion}{' '}
          <span style={{ color: c.textMuted }}>
            Nadie de la tienda lo ve en su pantalla: se lo tienen que pedir a usted.
          </span>
        </p>
      </div>
    </div>
  );
};

export default CodigoEntrega;
