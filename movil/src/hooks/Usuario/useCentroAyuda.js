import { useMemo } from 'react';
import { enlaceWhatsApp, DIRECCION_EN_UNA_LINEA, WHATSAPP } from '../../utils/tienda';

/*
 * useCentroAyuda — qué se le puede ofrecer al cliente que llegó buscando ayuda.
 * Puerto de `frontend/src/hooks/useCentroAyuda.js`.
 *
 * La regla es la del pie de página: solo se ofrece lo que EXISTE. El único
 * contacto real es el WhatsApp de utils/tienda.js; si no está configurado, no
 * hay bloque de contacto que pintar. Un canal de ayuda inventado es peor que
 * ninguno: es alguien marcando un tono que no lleva a nadie.
 */
const FAQS = [
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

const SALUDO_WHATSAPP = 'Hola, vengo de la tienda en linea y necesito ayuda con mi pedido.';

export const useCentroAyuda = () => {
  // Los canales se arman: cada uno entra solo si tiene a dónde llevar. El tipo
  // viaja en lugar del icono (elegir el dibujito es cosa de la pantalla).
  const canales = useMemo(() => {
    const lista = [];

    const whatsapp = enlaceWhatsApp(SALUDO_WHATSAPP);
    if (whatsapp) {
      lista.push({
        tipo: 'whatsapp',
        etiqueta: 'WhatsApp',
        valor: WHATSAPP.slice(-8).replace(/(\d{4})(\d{4})/, '$1-$2'),
        enlace: whatsapp,
      });
    }

    if (DIRECCION_EN_UNA_LINEA) {
      lista.push({
        tipo: 'direccion',
        etiqueta: 'Pasa a la tienda',
        valor: DIRECCION_EN_UNA_LINEA,
        enlace: null,
      });
    }

    return lista;
  }, []);

  return { faqs: FAQS, canales };
};

export default useCentroAyuda;
