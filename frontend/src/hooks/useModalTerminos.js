import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * ============================================================
 * useModalTerminos — leer las condiciones sin salir del formulario
 * ============================================================
 * POR QUÉ UN MODAL Y NO UN ENLACE.
 *
 * El primer intento fue un enlace con target="_blank": pestaña nueva, el
 * formulario intacto atrás. En un navegador de escritorio funciona. El problema
 * es por dónde entra la gente a esta tienda: por un enlace de WhatsApp, y ahí
 * el navegador de adentro de la aplicación NO siempre abre pestaña —a veces
 * navega encima—. Y navegar encima significa que quien tocó "términos" después
 * de llenar siete campos vuelve al formulario en blanco.
 *
 * Se probó y se vio pasar. Así que aquí no se navega a ningún lado: el
 * documento se abre encima y se cierra, y lo escrito nunca corre riesgo.
 *
 * Lo que este hook resuelve, además de abrir y cerrar:
 *   - Escape cierra, y solo se escucha mientras está abierto.
 *   - El fondo no se arrastra mientras se lee (el dedo en el teléfono termina
 *     moviendo la página de atrás si no se bloquea).
 *   - El foco entra al modal y VUELVE al botón que lo abrió. Sin eso, quien
 *     navega con teclado cierra el documento y aparece de vuelta al principio
 *     del formulario, con todo por recorrer otra vez.
 * ============================================================
 */

export const useModalTerminos = () => {
  const [abierto, setAbierto] = useState(false);
  // Quién lo abrió, para devolverle el foco al cerrar.
  const origen = useRef(null);

  const abrir = useCallback((evento) => {
    origen.current = evento?.currentTarget || null;
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  /*
   * El foco vuelve al botón que abrió el documento.
   *
   * Va en un efecto y no dentro de `cerrar` por una razón que costó verla:
   * al cerrar, el elemento enfocado (el botón de cerrar del modal) se
   * desmonta, y el navegador manda el foco al <body>. Si se devuelve el foco
   * ANTES de ese desmontaje, el navegador lo pisa un instante después y la
   * persona termina igual: al principio de la página. El efecto corre después
   * de que React ya sacó el modal, que es el único momento en que el foco se
   * queda donde se pone. Se probó con Escape y se vio fallar de la otra forma.
   */
  useEffect(() => {
    if (abierto || !origen.current) return;
    origen.current.focus?.();
    origen.current = null;
  }, [abierto]);

  // Escape. Solo mientras está abierto: dejar el listener puesto todo el
  // tiempo le quitaría la tecla a lo que la persona esté haciendo de verdad.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento) => { if (evento.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, cerrar]);

  /*
   * El fondo se queda quieto. Se guarda el valor previo en vez de asumir que
   * estaba vacío, para no pisar un bloqueo que ya hubiera puesto otra cosa.
   */
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [abierto]);

  return { abierto, abrir, cerrar };
};
