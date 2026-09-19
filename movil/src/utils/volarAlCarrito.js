import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

/*
 * ============================================================
 * VOLAR AL CARRITO — volarAlCarrito.js
 * ============================================================
 * Puerto de `frontend/src/utils/volarAlCarrito.js`: al tocar "+", una copia
 * de la foto del producto sale volando en arco hasta el ícono del carrito,
 * se encoge al llegar y el carrito se sacude. Misma idea, sin DOM — en vez
 * de clonar un nodo y moverlo con CSS, esto guarda la lista de "vuelos" en
 * curso en un registro compartido (mismo patrón que `arranqueResuelto` de
 * `navigationRef.js`) y un componente montado en la raíz de la app
 * (`VueloAlCarrito.js`, ver App.js) los dibuja con `Animated`.
 *
 * ── Por qué el destino es un registro y no una prop que baja por el árbol ──
 * El ícono del carrito vive en `BarraTienda.js`, que SOLO está en
 * `Inicio.js` — ni `Seccion.js` ni `Favoritos.js` lo tienen, igual que en la
 * web el botón del carrito no siempre está a la vista (el checkout, por
 * ejemplo). En vez de pasar una referencia al carrito por props hasta cada
 * tarjeta, `BarraTienda` se REGISTRA sola al montarse. Quien agrega solo
 * pregunta "¿hay destino ahora mismo, y se ve en pantalla?" — y si no lo
 * hay, o está tapado por otra pestaña, no pasa nada: se queda solo el aviso
 * de siempre, exactamente como en la web cuando `destinoVisible()` no
 * encuentra nada.
 *
 * ── Las dos curvas, calcadas de la web ──
 * `raw` avanza LINEAL de 0 a 1; el arco sale de aplicarle DOS curvas
 * distintas por separado (`Easing.bezier`, que sí corre en el hilo nativo):
 *   - X: `cubic-bezier(0.45, 0, 0.55, 1)` — pareja, sin sorpresas.
 *   - Y, escala, giro y opacidad: `cubic-bezier(0.6, -0.4, 0.74, 0.05)` — el
 *     control en -0.4 hace que el valor arranque por DEBAJO de 0 antes de
 *     avanzar: ese "retroceso" es lo que dibuja el arco.
 * ============================================================
 */

// 800ms, igual que la web. VueloAlCarrito.js es quien anima de verdad (ahí
// también viven las dos curvas bezier, junto al resto de lo que usa Animated).
export const DURACION_VUELO = 800;

let destinoRef = null;

export const registrarDestinoCarrito = (ref) => {
  destinoRef = ref;
};

const { width: ANCHO_PANTALLA, height: ALTO_PANTALLA } = Dimensions.get('window');

// Medidas de verdad y dentro de lo que se ve en pantalla: lo mismo que la
// web comprueba con `getBoundingClientRect` antes de volar (ver
// `destinoVisible` allá). Sin esto, una tarjeta agregada desde un apartado
// sin `BarraTienda` (Sección, Favoritos) volaría hacia donde el carrito
// quedó la última vez que SÍ estuvo en pantalla, no hacia ningún lado real.
const esVisible = (r) =>
  !!r && r.width > 0 && r.height > 0 && r.y + r.height > 0 && r.y < ALTO_PANTALLA && r.x < ANCHO_PANTALLA;

const oyentesVuelos = new Set();
let vuelos = [];
let idVuelo = 0;

const avisarVuelos = () => oyentesVuelos.forEach((fn) => fn());

export const useVuelosAlCarrito = () => {
  const [, forzar] = useState(0);
  useEffect(() => {
    const oyente = () => forzar((n) => n + 1);
    oyentesVuelos.add(oyente);
    return () => oyentesVuelos.delete(oyente);
  }, []);
  return vuelos;
};

// Sube uno cada vez que un vuelo termina: BarraTienda lo mira para disparar
// su propio sacudón (el ícono tiembla, el contador "pop"). Así este archivo
// no necesita saber nada de Animated ni de cómo se ve el ícono del carrito.
let aterrizajes = 0;
const oyentesAterrizaje = new Set();

export const useAterrizajeCarrito = () => {
  const [valor, setValor] = useState(aterrizajes);
  useEffect(() => {
    const oyente = () => setValor(aterrizajes);
    oyentesAterrizaje.add(oyente);
    return () => oyentesAterrizaje.delete(oyente);
  }, []);
  return valor;
};

/**
 * @param {{ current: import('react-native').View | null }} origenRef  la vista de la foto desde donde sale
 * @param {string} uri  la foto del producto
 */
export const volarAlCarrito = ({ origenRef, uri }) => {
  if (!uri || !origenRef?.current || !destinoRef?.current) return;

  origenRef.current.measureInWindow((ox, oy, ow, oh) => {
    const origen = { x: ox, y: oy, width: ow, height: oh };
    if (!esVisible(origen)) return;

    destinoRef.current?.measureInWindow((dx, dy, dw, dh) => {
      const destino = { x: dx, y: dy, width: dw, height: dh };
      if (!esVisible(destino)) return;

      idVuelo += 1;
      vuelos = [...vuelos, { id: idVuelo, uri, origen, destino }];
      avisarVuelos();
    });
  });
};

// Lo llama VueloAlCarrito.js cuando la animación termina (o se cancela por
// desmontarse a medio vuelo): saca el vuelo de la lista y avisa el
// aterrizaje. El chequeo del principio lo vuelve seguro de llamar dos veces
// -pasa cuando terminar el vuelo desmonta el componente y su limpieza
// también lo llama- sin contar el aterrizaje ni avisar de más la segunda vez.
export const terminarVuelo = (id, { aterrizo = true } = {}) => {
  if (!vuelos.some((v) => v.id === id)) return;
  vuelos = vuelos.filter((v) => v.id !== id);
  avisarVuelos();
  if (aterrizo) {
    aterrizajes += 1;
    oyentesAterrizaje.forEach((fn) => fn());
  }
};
