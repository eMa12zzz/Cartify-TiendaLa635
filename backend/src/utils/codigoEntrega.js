import { randomInt } from "crypto";

/*
 * ============================================================
 * EL CÓDIGO DE ENTREGA — codigoEntrega.js
 * ============================================================
 * Cuatro dígitos que prueban que quien recibe el pedido es quien lo hizo.
 *
 * EL PROBLEMA QUE RESUELVE
 * Hasta ahora, entregar era cuestión de fe. El repartidor llegaba a un portón,
 * alguien salía y decía "sí, es mío", y el pedido se marcaba como entregado.
 * En el local, igual: quien dijera el nombre se llevaba la bolsa. No había
 * NADA que distinguiera al cliente de un vecino que oyó el timbre — ni para
 * proteger al cliente que pagó, ni para proteger al repartidor el día que
 * alguien reclame que nunca recibió nada.
 *
 * El código lo emite el SERVIDOR al crear el pedido, viaja al cliente por su
 * pantalla de seguimiento, y el personal lo pide en la puerta. Sin él, el
 * pedido no se puede marcar como entregado.
 *
 * POR QUÉ CUATRO DÍGITOS Y NO UN TOKEN LARGO
 * Porque esto se dice en voz alta, en la calle, muchas veces bajo la lluvia o
 * con el motor encendido. Un código que no se puede dictar de un tirón no se
 * usa: el repartidor termina saltándoselo y volvemos al punto de partida.
 *
 * Cuatro dígitos son 10.000 combinaciones, y eso alcanza de sobra porque el
 * código NO se valida solo: se valida CONTRA UN PEDIDO CONCRETO. Que dos
 * pedidos del mismo día compartan código no le sirve a nadie — para usar el de
 * otro habría que adivinar además cuál es su pedido. Y no hay dónde probar en
 * bucle: el único que compara es el personal, con sesión, pedido por pedido.
 *
 * POR QUÉ randomInt Y NO Math.random
 * Math.random es predecible: quien vea unos cuantos códigos seguidos puede
 * calcular los siguientes. Es la diferencia entre un número al azar y un
 * número que solo PARECE al azar, y aquí el número es una llave.
 * ============================================================
 */

/*
 * Se emite para TODOS los pedidos, no solo los de domicilio.
 *
 * Retirar en el local tiene exactamente el mismo problema: el mostrador
 * también entrega a quien se presente. Y unificarlo evita la pregunta de
 * "¿este pedido llevaba código?" en la única pantalla donde importa.
 */
export const generarCodigoEntrega = () =>
  String(randomInt(0, 10000)).padStart(4, "0");

/*
 * La comparación, en un solo lugar.
 *
 * Se normaliza lo que llega —espacios de más, el cliente que lo dicta como
 * "un dos tres cuatro" y alguien lo escribe con espacios— porque rechazar un
 * código correcto por un espacio es peor que no tener código: enseña al
 * personal a saltárselo.
 */
export const codigoCoincide = (guardado, recibido) => {
  const limpio = String(recibido ?? "").replace(/\D/g, "");
  const esperado = String(guardado ?? "").replace(/\D/g, "");
  return esperado.length > 0 && limpio === esperado;
};
