/*
 * ============================================================
 * ACTIVIDAD DEL USUARIO — actividadUsuario.js
 * ============================================================
 * Un aviso de "el usuario se está moviendo" (scrolleando una lista, cambiando
 * de pestaña), para que BurbujaPedido se aparte sola en vez de estorbar.
 *
 * Mismo patrón que navigationRef.js y no un Context: quien avisa está
 * repartido en media docena de pantallas sueltas (Inicio, Seccion, Pedidos,
 * Favoritos, Carrito, la barra de pestañas...) que no tienen por qué estar
 * anidadas bajo un Provider en común solo para esto, y BurbujaPedido —la
 * única que escucha— ya vive fuera de ese árbol de todos modos.
 * ============================================================
 */

const oyentes = new Set();

// Lo llama cada lista al scrollear y la barra de pestañas al cambiar de
// apartado. No importa quién avisó ni cuántas veces: a quien escucha
// (BurbujaPedido) solo le hace falta saber que "algo se movió".
export const avisarActividad = () => {
  oyentes.forEach((fn) => fn());
};

export const suscribirseAActividad = (callback) => {
  oyentes.add(callback);
  return () => oyentes.delete(callback);
};
