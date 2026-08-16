/*
 * ============================================================
 * LOS AVISOS QUE FALTABAN — avisosCliente.js
 * ============================================================
 * Enciende los dos interruptores que la pantalla de Notificaciones ofrecía y
 * que no hacían nada: "Productos nuevos" y "Mi pedido va en camino". Se
 * guardaban en la cuenta y nadie los leía jamás, así que el cliente los
 * activaba y no le llegaba un solo correo.
 *
 * El de promociones vive aparte (avisoPromo.js) porque tiene su propia regla
 * de "una vez por promo" y su plantilla con precios de oferta.
 *
 * POR QUÉ EL CORREO SE ARMA POR PERSONA Y NO UNA VEZ PARA TODOS
 * Porque el enlace de "dejar de recibirlos" lleva un token firmado con el id
 * de quien lo recibe. Un enlace común para toda la lista daría de baja siempre
 * a la misma persona — o, peor, a quien tocara reenviar el correo. Ver
 * utils/tokenBaja.js.
 *
 * TODOS DISPARAN EN SEGUNDO PLANO: escribirle a la lista tarda, y quien acaba
 * de guardar un producto —o de marcar un pedido como "en camino"— no tiene por
 * qué mirar una rueda girando. Si el correo falla, la acción YA se guardó;
 * devolver un error sería mentir.
 * ============================================================
 */

import clientModel from "../models/client.js";
import storeSettingsModel, { CLAVE_UNICA } from "../models/storeSettings.js";
import { sendEmail } from "./sendMailMailjet.js";
import { plantillaProductosNuevos, plantillaPedidoEnCamino } from "./plantillasAviso.js";
import { enlaceDeBaja } from "./tokenBaja.js";

/*
 * La identidad de la tienda para el encabezado del correo: su nombre en dos
 * renglones y su logo si el dueño cargó uno en Personalización.
 */
export const identidadDeLaTienda = async () => {
  const a = await storeSettingsModel.findOne({ clave: CLAVE_UNICA }).lean();
  const l1 = a?.nombreLinea1 || "Tienda";
  const l2 = a?.nombreLinea2 || "";
  return {
    nombre: `${l1} ${l2}`.trim(),
    nombreLinea1: l1,
    nombreLinea2: l2,
    logoUrl: a?.logoUrl || "",
  };
};

/*
 * Los clientes que pidieron ESTE aviso. Devuelve id y correo: el id hace falta
 * para firmarle su enlace de baja.
 *
 * El $ne: false y no un true a secas: los clientes de antes de que existieran
 * las preferencias no tienen el campo, y con `: true` habrían quedado fuera
 * todos ellos. Ver avisoPromo.js, que usa la misma regla.
 */
const destinatariosDe = async (preferencia) => {
  const clientes = await clientModel
    .find({
      [`notificationPrefs.${preferencia}`]: { $ne: false },
      isActive: { $ne: false },
      isVerified: true,
      email: { $exists: true, $nin: [null, ""] },
    })
    .select("email")
    .lean();

  // Sin repetidos: el mismo correo dos veces es la queja número uno de
  // cualquier lista. Ver las cuentas duplicadas que hay en la base.
  const vistos = new Set();
  return clientes.filter((c) => {
    const correo = (c.email || "").trim().toLowerCase();
    if (!correo || vistos.has(correo)) return false;
    vistos.add(correo);
    return true;
  });
};

/*
 * De uno en uno, no todos de golpe: un Promise.all sobre trescientos correos
 * le dispara trescientas peticiones simultáneas a Mailjet, que responde 429 y
 * tira a la basura media lista. Y un correo por destinatario, nunca todos en
 * el mismo "Para": la lista de clientes de la tienda no se le reparte a los
 * clientes.
 *
 * `armar` recibe al cliente y devuelve { asunto, html, texto }: así cada quien
 * recibe su propio enlace de baja.
 */
const enviarEnFila = async (clientes, armar, etiqueta) => {
  let enviados = 0;
  let fallidos = 0;

  for (const cliente of clientes) {
    try {
      const { asunto, html, texto } = armar(cliente);
      await sendEmail(cliente.email, asunto, html, texto);
      enviados++;
    } catch (error) {
      // Un correo rebotado no puede frenar a los otros doscientos.
      fallidos++;
      console.log(`${etiqueta}: no se pudo enviar a ${cliente.email}: ${error.message}`);
    }
  }

  console.log(`${etiqueta}: ${enviados} enviados, ${fallidos} fallidos`);
  return { enviados, fallidos };
};

/* ══════════ 1. Productos nuevos ══════════ */

/*
 * EN LOTE, Y POR ESO ESPERA.
 *
 * Quien carga el inventario un lunes sube treinta productos de corrido. Con un
 * correo por producto, cada cliente recibiría treinta correos seguidos de la
 * misma tienda — que es la receta exacta para acabar en spam el mismo día.
 *
 * Así que los productos se van juntando y el aviso sale cuando pasan unos
 * minutos sin que se cargue nada más. La lista vive en memoria a propósito: si
 * el servidor se reinicia justo ahí, lo peor que pasa es que un aviso no sale.
 * Guardarlo en la base para no perderlo sería montar una cola de trabajos para
 * avisar de unas papas nuevas.
 */
const ESPERA_LOTE_MS = 5 * 60 * 1000;
let loteProductos = [];
let relojLote = null;

const soltarLoteDeProductos = async () => {
  const productos = loteProductos;
  loteProductos = [];
  relojLote = null;

  if (!productos.length) return { enviados: 0, fallidos: 0 };

  const clientes = await destinatariosDe("nuevosProductos");
  if (!clientes.length) {
    console.log("aviso de productos nuevos: nadie lo tiene encendido");
    return { enviados: 0, fallidos: 0 };
  }

  const tienda = await identidadDeLaTienda();

  return enviarEnFila(
    clientes,
    (cliente) => plantillaProductosNuevos({
      productos,
      tienda,
      enlaceBaja: enlaceDeBaja(cliente._id, "nuevosProductos"),
    }),
    "aviso de productos nuevos"
  );
};

/*
 * Lo llama el controlador al guardar un producto. No manda nada todavía: lo
 * apunta en el lote y reinicia el reloj.
 */
export const anotarProductoNuevo = (producto) => {
  if (!producto?.nombre) return;
  loteProductos.push(producto);

  // Cada producto nuevo estira la espera: se avisa cuando la persona TERMINÓ
  // de cargar, no a los cinco minutos del primero.
  if (relojLote) clearTimeout(relojLote);
  relojLote = setTimeout(() => {
    soltarLoteDeProductos().catch((error) => {
      console.log("aviso de productos nuevos: falló el envío completo: " + error);
    });
  }, ESPERA_LOTE_MS);

  /*
   * Sin esto, un servidor que no tiene nada más que hacer se queda despierto
   * cinco minutos esperando este reloj. Con unref() el proceso puede cerrarse
   * igual; el aviso se pierde, que es exactamente lo que ya asumimos arriba.
   */
  relojLote.unref?.();
};

/* ══════════ 2. El pedido va en camino ══════════ */

/*
 * Este va a UNA persona: la dueña del pedido. No hay lista ni lote.
 */
export const avisarPedidoEnCamino = async (pedido) => {
  const idCliente = pedido?.clientId?._id || pedido?.clientId;
  if (!idCliente) return { enviados: 0, motivo: "el pedido no tiene cliente" };

  const cliente = await clientModel
    .findById(idCliente)
    .select("email fullName notificationPrefs isActive")
    .lean();

  if (!cliente?.email) return { enviados: 0, motivo: "el cliente no tiene correo" };
  if (cliente.isActive === false) return { enviados: 0, motivo: "la cuenta está inactiva" };

  /*
   * Aquí SÍ se pide el true explícito, al revés que en los otros dos.
   *
   * Este interruptor nace APAGADO en el modelo, así que "no tengo el campo"
   * significa "no lo he encendido nunca". Con un $ne: false le llegaría el
   * aviso a todo el mundo, que es justo lo contrario de lo que eligieron.
   */
  if (cliente.notificationPrefs?.pedidoCerca !== true) {
    return { enviados: 0, motivo: "no tiene encendido el aviso de pedido en camino" };
  }

  const tienda = await identidadDeLaTienda();

  return enviarEnFila(
    [cliente],
    () => plantillaPedidoEnCamino({ pedido, nombreCliente: cliente.fullName || "", tienda }),
    "aviso de pedido en camino"
  );
};

/*
 * La versión que llama el controlador: dispara y se olvida.
 *
 * El .catch no es opcional. Sin él, un tropiezo aquí adentro es una promesa
 * rechazada sin dueño, y Node se lleva el proceso entero por delante — o sea,
 * la tienda se cae porque un correo no salió.
 */
export const avisarPedidoEnCaminoEnSegundoPlano = (pedido) => {
  avisarPedidoEnCamino(pedido).catch((error) => {
    console.log("aviso de pedido en camino: falló el envío: " + error);
  });
};
