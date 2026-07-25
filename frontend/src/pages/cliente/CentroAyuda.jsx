import { HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useClientTheme';

/*
 * CentroAyuda — página estática de ayuda del cliente (área "Mi Cuenta").
 * Preguntas frecuentes + canales de contacto de la tienda. Sin backend.
 */
const faqs = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Explora la tienda, agrega productos al carrito y presiona comprar. También puedes usar el asistente por voz para pedir hablando.',
  },
  {
    q: '¿Cómo funcionan los puntos de fidelidad?',
    a: 'Ganas puntos con cada compra según lo que gastes. Los ves en la sección "Puntos de fidelidad" y vencen pasado un tiempo.',
  },
  {
    q: '¿Dónde veo mis pedidos?',
    a: 'En "Mis pedidos" ves el estado de cada compra; cuando te la entregan, pasa a "Recibos".',
  },
];

const CentroAyuda = () => {
  const { palette } = useTheme();
  const c = palette.colors;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: c.textPrimary }}>Centro de ayuda</h1>

      {/* Canales de contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: Phone, label: 'Llámanos', value: '2222-2222' },
          { icon: Mail, label: 'Correo', value: 'ayuda@la635.com' },
          { icon: MessageCircle, label: 'WhatsApp', value: '7777-7777' },
        ].map((canal, i) => {
          const Icon = canal.icon;
          return (
            <div key={i} className="p-4 rounded-xl flex items-center gap-3"
                 style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
              <Icon className="w-5 h-5 flex-none" style={{ color: c.primary }} />
              <div>
                <div className="text-xs" style={{ color: c.textMuted }}>{canal.label}</div>
                <div className="text-sm font-semibold" style={{ color: c.textPrimary }}>{canal.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preguntas frecuentes */}
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5" style={{ color: c.primary }} />
        <h2 className="text-base font-bold" style={{ color: c.textPrimary }}>Preguntas frecuentes</h2>
      </div>
      <div className="flex flex-col gap-5">
        {faqs.map((faq, i) => (
          <div key={i}>
            <div className="text-sm font-bold mb-1" style={{ color: c.textPrimary }}>{faq.q}</div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CentroAyuda;
