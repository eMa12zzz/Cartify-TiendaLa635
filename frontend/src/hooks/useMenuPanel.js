import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/*
 * ============================================================
 * EL MENÚ DEL PANEL EN PANTALLA CHICA — useMenuPanel.js
 * ============================================================
 * El menú medía 256px fijos pegados a la izquierda, siempre. En un escritorio
 * eso es una barra lateral; en un teléfono de 375px son dos tercios de la
 * pantalla ocupados por navegación, con el contenido empujado fuera del
 * viewport. Y el encargado de la tienda administra desde el teléfono.
 *
 * Así que en pantalla chica el mismo menú pasa a ser un cajón: vive fuera de
 * la pantalla y entra por encima del contenido cuando se pide. En pantalla
 * ancha no cambia nada — sigue siendo la barra de siempre.
 *
 * Aquí vive TODO el comportamiento de ese cajón (cuándo está abierto, cuándo
 * se cierra solo, el bloqueo del scroll). Los componentes solo lo consumen.
 * ============================================================
 */

// El mismo corte que usa `lg:` en Tailwind. Si se cambia uno hay que cambiar
// el otro: la clase decide cómo se ve y esto decide cómo se comporta.
const ESCRITORIO = '(min-width: 1024px)';

export const useMenuPanel = () => {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);

  /*
   * El ancho se consulta en el primer render y no en un efecto, porque de esto
   * dependen el aria-hidden y el inert del menú: si arrancara siempre en
   * "pantalla chica", en un escritorio habría un parpadeo en el que la barra
   * lateral —visible— estaría anunciada como oculta para el lector de pantalla.
   */
  const [esEscritorio, setEsEscritorio] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(ESCRITORIO).matches
  );

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);
  const alternar = useCallback(() => setAbierto((previo) => !previo), []);

  // Seguimos el ancho para saber si el menú es una barra o un cajón.
  useEffect(() => {
    const consulta = window.matchMedia(ESCRITORIO);
    const alCambiar = (evento) => setEsEscritorio(evento.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  /*
   * Al ensancharse la ventana el cajón deja de existir como tal. Si no se
   * apagara el estado, el bloqueo del scroll se quedaría puesto en una pantalla
   * donde ya no hay nada que bloquear, y al volver a angostarla el menú
   * aparecería abierto sin que nadie lo pidiera.
   */
  useEffect(() => {
    if (esEscritorio) setAbierto(false);
  }, [esEscritorio]);

  // Al navegar, el cajón se va. Si no, uno toca "Inventario" y se queda
  // mirando el menú encima de lo que acaba de pedir.
  useEffect(() => { setAbierto(false); }, [pathname]);

  /*
   * Escape. Solo se escucha mientras está abierto: dejar el listener puesto
   * todo el tiempo haría que esta pantalla se quedara con la tecla aunque el
   * menú no tenga nada que ver con lo que el usuario está haciendo.
   */
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  /*
   * Sin esto, el dedo que quiere recorrer el menú termina arrastrando la
   * página de atrás y el cajón se queda flotando sobre contenido que se movió.
   * Se guarda el valor previo en vez de asumir que era vacío, para no pisar un
   * bloqueo que ya hubiera puesto otra cosa (un modal, por ejemplo).
   */
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [abierto]);

  /*
   * Tocar un enlace del grupo donde uno YA está no cambia la ruta, así que el
   * cierre por navegación no se entera y el cajón se queda abierto. Se mira si
   * el clic cayó sobre un enlace y no sobre el botón que despliega un grupo:
   * ese tiene que poder abrirse sin que el menú se cierre debajo del dedo.
   */
  const alTocarNavegacion = useCallback((evento) => {
    if (evento.target.closest('a')) setAbierto(false);
  }, []);

  return {
    abierto,
    esEscritorio,
    // En pantalla chica y cerrado el menú está fuera de la pantalla: hay que
    // sacarlo también del alcance del teclado y de los lectores de pantalla,
    // o el tabulador se pierde recorriendo trece enlaces invisibles.
    oculto: !esEscritorio && !abierto,
    abrir,
    cerrar,
    alternar,
    alTocarNavegacion,
  };
};
