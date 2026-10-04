/*
 * ============================================================
 * ONBOARDING — la bienvenida de la app, una sola vez
 * ============================================================
 * Lo primero que ve quien acaba de instalar la app: cuatro diapositivas que
 * explican qué se puede hacer aquí, antes de pedirle que entre o se registre.
 * RootNavigator.js decide si esto se muestra (lee `utils/almacen.js` con la
 * misma llave que graba OnboardingRoute al terminar) — este archivo solo dice
 * qué cuenta cada diapositiva.
 *
 * ── Con el estilo de Tiqui ──
 * La cuenta Tiqui, en primera persona y tuteando, con el MISMO molde de su
 * tutorial (components/Tiqui/TutorialTiqui.js): fondo claro, una ilustración
 * suya en cada diapositiva, el titular navy con su palabra en azul y el botón
 * navy. Antes era otra cosa —degradados de la temporada, una cuadrícula,
 * íconos de marca de agua, un botón de vidrio y maquetas con fotos— y al lado
 * del tutorial de Tiqui parecía de otra app.
 *
 * ── De dónde sale el texto ──
 * Son las mismas cuatro promesas de antes, que repiten las Ventajas del login
 * de la web (frontend/src/pages/LoginClient.jsx): no se inventó nada nuevo,
 * solo cambió quién lo cuenta. El titular de la primera es el eslogan de la
 * tienda, "a un toque".
 * ============================================================
 */

import TutorialTiqui from '../components/Tiqui/TutorialTiqui';
import { ESCENAS_TIQUI, NAVY } from '../components/Tiqui/EscenasTiqui';
import MarcaTienda from '../components/UI/MarcaTienda';
import SelectorIdioma from '../components/UI/SelectorIdioma';

const DIAPOSITIVAS = [
  {
    clave: 'tienda',
    tituloPrefijo: 'El súper de la esquina,\na un ',
    tituloAcento: 'toque',
    texto: 'Soy Tiqui y te doy la bienvenida. Aquí compras desde el celular y te lo llevamos a tu puerta, o pasas a recogerlo.',
  },
  {
    clave: 'voz',
    tituloPrefijo: 'Pídeme las cosas\n',
    tituloAcento: 'hablando',
    texto: 'Dime qué necesitas, por ejemplo "dos manzanas y una leche", y yo armo tu pedido sin que escribas nada.',
  },
  {
    clave: 'mapa',
    tituloPrefijo: 'Sigue tu pedido en\n',
    tituloAcento: 'el mapa',
    texto: 'Ves al repartidor acercarse y sabes cuándo salir a la puerta.',
  },
  {
    clave: 'puntos',
    tituloPrefijo: 'Junta puntos con\n',
    tituloAcento: 'cada compra',
    texto: 'Se vuelven descuento la próxima vez. Y lo que marques con el corazón no se te pierde.',
  },
].map((d) => ({ ...d, Escena: ESCENAS_TIQUI[d.clave] }));

const Onboarding = ({ alTerminar }) => (
  <TutorialTiqui
    diapositivas={DIAPOSITIVAS}
    alTerminar={alTerminar}
    textoFinal="Comenzar"
    cerrar="saltar"
    etiquetaCerrar="Saltar la introducción"
    // En la primera, el atrás de Android sale de la app: es la pantalla de arranque.
    atrasCierra={false}
    arriba={<MarcaTienda tamano={14} color={NAVY} />}
    // La primera pantalla de todas: quien no lee español cambia aquí.
    pie={<SelectorIdioma color={NAVY} />}
  />
);

export default Onboarding;
