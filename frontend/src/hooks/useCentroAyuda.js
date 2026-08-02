import { useMemo } from 'react';
import { enlaceWhatsApp, DIRECCION_EN_UNA_LINEA, WHATSAPP } from '../utils/tienda';

/*
 * useCentroAyuda — qué se le puede ofrecer al cliente que llegó buscando ayuda.
 *
 * La página nació con un teléfono "2222-2222", un correo "ayuda@la635.com" y un
 * WhatsApp "7777-7777" escritos a mano. Ninguno de los tres existe: eran relleno
 * de maqueta que se quedó. Y un canal de ayuda inventado no es un detalle
 * cosmético — es alguien marcando desde la parada del bus porque no le llegó el
 * pedido, escuchando un tono que no lleva a nadie.
 *
 * La regla es la misma del pie de página: solo se ofrece lo que existe. El único
 * contacto real de la tienda es el WhatsApp del .env, así que si ese número no
 * está configurado, no hay bloque de contacto que pintar.
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

// El mensaje ya escrito le ahorra al cliente tener que explicar de dónde viene.
const SALUDO_WHATSAPP =
  'Hola, vengo de la tienda en linea y necesito ayuda con mi pedido.';

export const useCentroAyuda = () => {
  /*
   * Los canales se arman, no se listan: cada uno entra solo si tiene a dónde
   * llevar. El tipo viaja en lugar del icono porque elegir el dibujito es cosa
   * de la pantalla, no de aquí.
   */
  const canales = useMemo(() => {
    const lista = [];

    const whatsapp = enlaceWhatsApp(SALUDO_WHATSAPP);
    if (whatsapp) {
      lista.push({
        tipo: 'whatsapp',
        etiqueta: 'WhatsApp',
        // Se muestra tal como se marca en El Salvador: 7890-1234.
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
