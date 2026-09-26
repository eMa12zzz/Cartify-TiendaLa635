import orderModel from "../models/order.js";
import { avisarCambioDePedidoEnSegundoPlano } from "./avisosCliente.js";
import { codigoCoincide } from "./codigoEntrega.js";

/*
 * ============================================================
 * CAMBIAR EL ESTADO DE UN PEDIDO — estadoPedido.js
 * ============================================================
 * Lo que pasa cuando un pedido avanza (preparando, en camino, listo,
 * entregado, cancelado), en UN solo lugar. Lo usan el botón de la pantalla de
 * Pedidos (orderController.updateOrderStatus) y Tiqui del panel cuando se lo
 * piden por voz (tiquiPanelController): los dos tienen que sellar la hora,
 * pedir el código de entrega y avisarle al cliente exactamente igual. Si cada
 * uno lo hiciera a su manera, un pedido movido por voz se saltaría el código
 * o no le llegaría el aviso a nadie.
 *
 * No responde HTTP: devuelve { ok, order } o { ok: false, codigo, message }
 * y cada quien lo cuenta a su manera.
 * ============================================================
 */

export const ESTADOS_PEDIDO = ["pagado", "preparando", "en_camino", "listo", "entregado", "cancelado"];

export const cambiarEstadoDePedido = async ({ id, status, quien = "", codigoEntrega, omitirCodigo, motivoOmision }) => {
  if (!ESTADOS_PEDIDO.includes(status)) {
    return { ok: false, codigo: 400, message: "Estado inválido" };
  }

  // +deliveryCode: hace falta para compararlo abajo. No sale de aquí: la
  // respuesta se arma con el documento ya actualizado, que no lo trae.
  const actual = await orderModel.findById(id).select("+deliveryCode");
  if (!actual) return { ok: false, codigo: 404, message: "Pedido no encontrado" };

  const cambios = { status };

  /*
   * ── NO SE ENTREGA SIN COMPROBAR A QUIÉN ──
   *
   * Este es el único punto del sistema donde el código de entrega sirve para
   * algo. Todo lo demás —emitirlo, guardarlo, enseñárselo al cliente— existe
   * para que esta comparación se pueda hacer.
   *
   * Se pide solo en el SALTO a entregado: volver a tocar el botón en un
   * pedido ya entregado no puede exigir el código otra vez, porque el
   * cliente ya se fue con su bolsa.
   */
  if (status === "entregado" && actual.status !== "entregado") {
    if (!actual.deliveryCode) {
      /*
       * Pedido anterior a esta función. No lleva código y no se le puede
       * exigir uno: dejarlo trabado sería castigar al cliente por una
       * mejora nuestra. Se entrega como se entregaba antes.
       */
    } else if (omitirCodigo) {
      /*
       * La salida de emergencia. Existe porque sin ella el personal
       * terminaría marcando los pedidos como entregados ANTES de salir de
       * la tienda, y ahí el código no valdría nada. Pero cuesta escribir
       * por qué, y ese por qué queda guardado en el pedido.
       */
      const motivo = String(motivoOmision || "").trim();
      if (motivo.length < 4) {
        return { ok: false, codigo: 400, message: "Escriba por qué se entrega sin código." };
      }
      cambios.deliveryCodeOmitido = true;
      cambios.deliveryCodeMotivo = motivo.slice(0, 200);
    } else if (!codigoCoincide(actual.deliveryCode, codigoEntrega)) {
      return {
        ok: false,
        codigo: 400,
        message: "El código no coincide. Pídale al cliente los 4 dígitos que ve en su pedido.",
      };
    } else {
      cambios.deliveryCodeVerifiedAt = new Date();
    }
  }

  /*
   * Se sella la hora y el nombre de quien movió el pedido. Solo la primera
   * vez: si alguien vuelve a marcar "preparando" después de un error, la hora
   * original no se pierde.
   */
  if (status === "preparando" && !actual.preparedAt) {
    cambios.preparedAt = new Date();
    cambios.preparedBy = quien;
  }
  if (status === "en_camino" && !actual.enCaminoAt) {
    cambios.enCaminoAt = new Date();
    cambios.enCaminoBy = quien;
  }
  if (status === "listo" && !actual.listoAt) {
    cambios.listoAt = new Date();
    cambios.listoBy = quien;
  }
  if (status === "entregado" && !actual.deliveredAt) {
    cambios.deliveredAt = new Date();
    cambios.deliveredBy = quien;
  }

  /*
   * Se acabó el viaje, se acaba el rastro. Cuando el pedido llega o se
   * cancela, la posición del repartidor deja de tener sentido para todos: se
   * borra el punto, no solo se apaga.
   */
  if (status === "entregado" || status === "cancelado") {
    cambios.courier = { active: false };
  }

  const order = await orderModel.findByIdAndUpdate(id, cambios, { new: true });
  if (!order) return { ok: false, codigo: 404, message: "Pedido no encontrado" };

  /*
   * El aviso del paso, a quien lo pidió (ver utils/avisosCliente.js). Solo en
   * el SALTO de estado: quien vuelve a tocar el botón —o corrige el estado
   * tras un error— no le manda el mismo aviso otra vez a quien ya lo recibió.
   *
   * Sin await: el pedido ya se guardó y quien está en el mostrador no tiene
   * por qué esperar a que salga un aviso.
   */
  if (status !== actual.status) {
    avisarCambioDePedidoEnSegundoPlano(order, status);
  }

  return { ok: true, order, anterior: actual.status };
};
