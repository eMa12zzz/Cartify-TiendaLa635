/*
 * ============================================================
 * CONOCE A TIQUI — el tutorial de la mascota
 * ============================================================
 * Seis ilustraciones donde Tiqui se presenta a sí misma: quién es, cómo se le
 * habla, qué sabe hacer y dónde encontrarla. Habla en primera persona y
 * tuteando, como en la web y en su video. Tiqui es ELLA.
 *
 * Tiqui es lo que distingue a esta tienda, así que no se deja a que alguien
 * la descubra por casualidad: el tutorial se abre la primera vez que se entra
 * a la pestaña del asistente, y se puede volver a ver desde ahí ("¿Quién es
 * Tiqui?"). Ver ConoceATiquiRoute en navigation/RootNavigator.js.
 *
 * Cómo se ve (fondo claro, Tiqui en navy, titular con su palabra en azul,
 * botón navy) vive en components/Tiqui/TutorialTiqui.js: el mismo molde de la
 * bienvenida de la app (Onboarding), para que los dos se vean iguales. Las
 * ilustraciones, en components/Tiqui/EscenasTiqui.js.
 * ============================================================
 */

import TutorialTiqui from '../components/Tiqui/TutorialTiqui';
import { ESCENAS_TIQUI } from '../components/Tiqui/EscenasTiqui';
import { llave } from '../utils/almacen';

// "Ya la conoce": con esto no se vuelve a abrir sola. Lo lee Asistente.js y
// lo graba ConoceATiquiRoute (navigation/RootNavigator.js) al cerrar.
export const LLAVE_TIQUI_PRESENTADO = llave('tiqui', 'presentado');

/*
 * Lo que cuenta Tiqui. Solo promete lo que la app de verdad hace: pedir por
 * voz, ofertas y recomendaciones, avisar lo que no hay (nunca agrega algo que
 * no se pidió), llevar a pagar y seguir el pedido en el mapa.
 */
const DIAPOSITIVAS = [
  {
    clave: 'hola',
    tituloPrefijo: '¡Hola! Soy ',
    tituloAcento: 'Tiqui',
    texto: 'Soy la etiqueta de precio de la tienda, pero con cara. Vivo en la app y te ayudo a comprar sin escribir nada.',
  },
  {
    clave: 'voz',
    tituloPrefijo: 'Háblame y armo\n',
    tituloAcento: 'tu pedido',
    texto: 'Tócame para despertarme y dime, por ejemplo: "quiero dos manzanas y una leche". Yo lo pongo en tu carrito.',
  },
  {
    clave: 'ofertas',
    tituloPrefijo: 'Te cuento lo que\n',
    tituloAcento: 'está en oferta',
    texto: 'Pregúntame qué hay en promoción o qué te recomiendo para el desayuno. Me conozco toda la tienda.',
  },
  {
    clave: 'honesto',
    tituloPrefijo: 'Si no lo tengo,\n',
    tituloAcento: 'te lo digo',
    texto: 'Nunca meto en tu carrito algo que no pediste. Si se acabó o no lo vendemos, te aviso y te ofrezco lo más parecido.',
  },
  {
    clave: 'pedido',
    tituloPrefijo: 'Te llevo a pagar\n',
    tituloAcento: 'en un momento',
    texto: 'Cuando me dices que sí, te abro el pago. Después puedes seguir tu pedido en el mapa hasta que llegue.',
  },
  {
    clave: 'empezar',
    tituloPrefijo: 'Me encuentras en\n',
    tituloAcento: 'Asistente',
    texto: 'Tócame cuando quieras y me despierto. Si hay ruido o no te entendí, te pido que lo repitas: no pasa nada.',
  },
].map((d) => ({ ...d, Escena: ESCENAS_TIQUI[d.clave] }));

const ConoceATiqui = ({ alTerminar }) => (
  <TutorialTiqui
    diapositivas={DIAPOSITIVAS}
    alTerminar={alTerminar}
    textoFinal="Hablar con Tiqui"
    cerrar="x"
    etiquetaCerrar="Cerrar la presentación de Tiqui"
    atrasCierra
  />
);

export default ConoceATiqui;
