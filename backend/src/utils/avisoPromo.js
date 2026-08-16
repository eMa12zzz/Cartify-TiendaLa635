/*
 * ============================================================
 * AVISAR DE UNA PROMOCIÓN NUEVA — avisoPromo.js
 * ============================================================
 * Cuando la tienda publica una promoción, les escribe a los clientes que
 * pidieron enterarse.
 *
 * POR QUÉ NO BLOQUEA AL PANEL
 * Escribirle a doscientas personas tarda; el gerente que acaba de darle a
 * "Crear promoción" no tiene por qué mirar una rueda girando mientras tanto —
 * y peor: si el correo falla, la promo YA se guardó, así que devolver un error
 * sería mentirle. El controlador dispara esto y responde de una. Lo que pase
 * después se anota en la consola y en la propia promoción.
 *
 * A QUIÉN LE LLEGA
 * A los clientes activos, verificados y con `notificationPrefs.promociones`
 * encendido. Quien se registró y dejó la casilla en blanco NO recibe nada: en
 * el registro esa casilla llega desmarcada y su valor se copia tal cual a las
 * preferencias (ver registerClient). Los clientes viejos —los de antes de que
 * hubiera dónde elegir— sí reciben, porque el modelo los deja en true a
 * propósito, y en el pie del correo tienen su enlace para darse de baja.
 * ============================================================
 */

import promotionModel from "../models/promotion.js";
import clientModel from "../models/client.js";
import { identidadDeLaTienda } from "./avisosCliente.js";
import { enlaceDeBaja } from "./tokenBaja.js";
import { sendEmail } from "./sendMailMailjet.js";
import { plantillaCorreoPromo } from "./plantillaCorreoPromo.js";

/*
 * De los items de la promo a lo que la plantilla sabe pintar.
 *
 * El precio de oferta se calcula AQUÍ y no se lee de ningún lado, por lo mismo
 * que el carrito no confía en el precio que manda el navegador: el número que
 * va en el correo tiene que ser el que se va a cobrar.
 */
const armarItems = (promo) =>
  (promo.items || [])
    // Un producto borrado del inventario deja su item huérfano: populate
    // devuelve null y en el correo saldría una fila en blanco con precio $0.00.
    .filter((item) => item.productId)
    .map((item) => {
      const producto = item.productId;
      const precio = Number(producto.salePrice) || 0;

      let precioOferta = null;
      if (promo.type === "descuento" && Number(item.discount) > 0) {
        precioOferta = Number((precio * (1 - Number(item.discount) / 100)).toFixed(2));
      } else if (promo.type === "precio_fijo" && item.fixedPrice != null && item.fixedPrice !== "") {
        precioOferta = Number(item.fixedPrice);
      }
      // 'nxm' y 'anuncio' no tocan el precio unitario: el ahorro del nxm lo
      // hace el carrito al cobrar, y el anuncio no rebaja nada.

      return {
        nombre: producto.name || "Producto",
        imagen: Array.isArray(producto.image) ? producto.image[0] : producto.image,
        precio,
        precioOferta,
        descuento: Number(item.discount) || 0,
      };
    });

/*
 * Los destinatarios. Solo el correo: no hace falta traerse la cuenta entera de
 * cada cliente —con sus direcciones y sus métodos de pago— para mandar un
 * volante.
 */
const buscarDestinatarios = async () => {
  const clientes = await clientModel
    .find({
      /*
       * $ne: false y no true a secas. Los clientes de antes de que existieran
       * las preferencias no tienen el campo, y con `: true` habrían quedado
       * fuera todos ellos — que son justamente los de siempre.
       */
      "notificationPrefs.promociones": { $ne: false },
      isActive: { $ne: false },
      isVerified: true,
      email: { $exists: true, $nin: [null, ""] },
    })
    .select("email")
    .lean();

  /*
   * Sin repetidos, y devolviendo el ID además del correo: el enlace de "dejar
   * de recibirlos" lleva un token firmado con el id de quien lo recibe, así
   * que el correo se arma por persona. Ver utils/tokenBaja.js.
   */
  const vistos = new Set();
  return clientes.filter((c) => {
    const correo = (c.email || "").trim().toLowerCase();
    if (!correo || vistos.has(correo)) return false;
    vistos.add(correo);
    return true;
  });
};

/*
 * Manda el aviso de UNA promoción.
 *
 * @param {string} promoId
 * @returns {Promise<{enviados:number, fallidos:number, motivo?:string}>}
 *   Se devuelve el resumen —en vez de no devolver nada— para poder probarlo
 *   con un script sin tener que leer la consola.
 */
export const avisarPromoNueva = async (promoId) => {
  const promo = await promotionModel.findById(promoId).populate("items.productId");

  if (!promo) return { enviados: 0, fallidos: 0, motivo: "la promoción ya no existe" };

  /*
   * UNA sola vez por promoción. Si mañana alguien la edita —para corregir una
   * palabra del título— nadie tiene que recibir el mismo volante otra vez.
   */
  if (promo.avisoEnviadoEn) {
    return { enviados: 0, fallidos: 0, motivo: "ya se había avisado de esta promoción" };
  }

  // Una promo apagada, sin banner o ya vencida no se anuncia. La de "sin
  // banner" es a propósito: ese es el descuento silencioso, el que la tienda
  // aplica sin publicarlo (ver el modelo). Anunciarlo por correo sería
  // exactamente lo contrario de lo que pidió.
  if (!promo.isActive) return { enviados: 0, fallidos: 0, motivo: "la promoción está apagada" };
  if (!promo.showBanner) return { enviados: 0, fallidos: 0, motivo: "es un descuento silencioso" };
  if (promo.endsAt && new Date(promo.endsAt) < new Date()) {
    return { enviados: 0, fallidos: 0, motivo: "la promoción ya venció" };
  }

  const items = armarItems(promo);
  if (!items.length) return { enviados: 0, fallidos: 0, motivo: "la promoción quedó sin productos" };

  const correos = await buscarDestinatarios();
  if (!correos.length) return { enviados: 0, fallidos: 0, motivo: "nadie tiene las promociones encendidas" };

  // El nombre, y el logo si el dueño cargó uno: el correo tiene que decir de
  // qué tienda es antes de decir qué ofrece.
  const tienda = await identidadDeLaTienda();

  /*
   * De uno en uno, no todos de golpe.
   *
   * Un Promise.all sobre trescientos correos le dispara trescientas peticiones
   * simultáneas a Mailjet, que responde 429 y tira a la basura la mitad de la
   * lista. En fila llegan todos; tarda más, pero esto corre en segundo plano y
   * nadie está esperándolo.
   *
   * Y uno por destinatario, nunca todos en el mismo "Para": la lista de
   * clientes de la tienda no es algo que se le reparta a los clientes.
   */
  let enviados = 0;
  let fallidos = 0;

  for (const cliente of correos) {
    const para = cliente.email;
    try {
      const { asunto, html, texto } = plantillaCorreoPromo({
        promo,
        items,
        tienda,
        enlaceBaja: enlaceDeBaja(cliente._id, "promociones"),
      });
      await sendEmail(para, asunto, html, texto);
      enviados++;
    } catch (error) {
      // Un correo rebotado no puede frenar a los otros doscientos.
      fallidos++;
      console.log(`aviso de promo: no se pudo enviar a ${para}: ${error.message}`);
    }
  }

  /*
   * Se marca aunque hayan fallado algunos: la alternativa es reintentar la
   * lista completa la próxima vez y volver a escribirle a los que sí
   * recibieron.
   */
  await promotionModel.findByIdAndUpdate(promoId, { $set: { avisoEnviadoEn: new Date() } });

  console.log(`aviso de promo "${promo.title || promo.promoDescription}": ${enviados} enviados, ${fallidos} fallidos`);
  return { enviados, fallidos };
};

/*
 * La versión que llama el controlador: dispara y se olvida.
 *
 * El `.catch` no es opcional. Sin él, cualquier tropiezo aquí adentro es una
 * promesa rechazada sin dueño, y Node se lleva el proceso entero por delante —
 * o sea, la tienda se cae porque un correo no salió.
 */
export const avisarPromoNuevaEnSegundoPlano = (promoId) => {
  avisarPromoNueva(promoId).catch((error) => {
    console.log("aviso de promo: falló el envío completo: " + error);
  });
};

export default avisarPromoNueva;
