import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";
import orderModel from "../models/order.js";
import productModel from "../models/product.js";
import promotionModel from "../models/promotion.js";
import storeSettingsModel, { CLAVE_UNICA } from "../models/storeSettings.js";
import { cambiarEstadoDePedido } from "./estadoPedido.js";
import { codigoCoincide } from "./codigoEntrega.js";
import { avisarPromoNuevaEnSegundoPlano } from "./avisoPromo.js";
import { codigoDePedido, olvidarPanorama, temporadasDisponibles } from "./panoramaNegocio.js";

/*
 * ============================================================
 * LO QUE TIQUI DEL PANEL PUEDE CAMBIAR — cambiosTiqui.js
 * ============================================================
 * Tiqui NUNCA cambia nada por su cuenta. El camino es siempre en dos pasos:
 *
 *   1. proponerCambio: lo que entendió el modelo se valida contra la base (que
 *      el pedido exista, que el paso tenga sentido, que el producto sea ese)
 *      y se convierte en una frase: "Paso el pedido #88D230 a listo para
 *      recoger. ¿Lo hago?". La propuesta sale FIRMADA (firmarPropuesta), con
 *      quién la pidió y 5 minutos de vida.
 *   2. aplicarCambio: solo cuando la persona dice que sí. Se vuelve a validar
 *      con lo que hay AHORA (en esos segundos otro empleado pudo mover el
 *      pedido) y se aplica con la misma lógica que las pantallas del panel.
 *
 * El modelo puede entender mal —"el pedido de María" cuando hay tres—, y un
 * pedido mal movido le manda un aviso equivocado a un cliente. Por eso la
 * confirmación no es opcional ni la decide el modelo: la exige el servidor.
 *
 * Quién puede qué: el empleado mueve pedidos (igual que en su pantalla); el
 * resto —existencias, precios, productos, promociones y temporada— es del
 * administrador, como sus pantallas.
 * ============================================================
 */

export const CAMBIOS_ADMIN = [
  "estado_pedido", "existencias", "precio", "mostrar_producto", "ocultar_producto",
  "activar_promocion", "desactivar_promocion", "temporada",
];
export const CAMBIOS_EMPLEADO = ["estado_pedido"];

export const ESTADOS_DESTINO = ["preparando", "en_camino", "listo", "entregado", "cancelado"];

const NOMBRE_ESTADO = {
  pagado: "por preparar", preparando: "en preparación", en_camino: "en camino",
  listo: "listo para recoger", entregado: "entregado", cancelado: "cancelado",
};

const plata = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const escaparRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const aPlano = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// El pedido por su número (#A1B2C3, los últimos 6 del id). Si hay más de uno
// que calce, no se adivina: se pide el número completo.
const buscarPedido = async (numero) => {
  const limpio = String(numero || "").replace(/[^a-f0-9]/gi, "").slice(-6);
  if (limpio.length < 4) return { error: "¿Qué pedido? Dime su número, el que empieza con numeral en la tarjeta." };
  const encontrados = await orderModel
    .find({ $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${limpio}$`, options: "i" } } })
    .select("+deliveryCode")
    .populate("clientId", "fullName")
    .limit(2);
  if (!encontrados.length) return { error: `No encuentro el pedido #${limpio.toUpperCase()}. ¿Me repites el número?` };
  if (encontrados.length > 1) return { error: `Hay más de un pedido que termina en ${limpio.toUpperCase()}. Dime el número completo.` };
  return { pedido: encontrados[0] };
};

// El producto por su nombre EXACTO (sin distinguir mayúsculas ni tildes).
const buscarProducto = async (nombre) => {
  const texto = String(nombre || "").trim();
  if (!texto) return { error: "¿De qué producto? Dime su nombre como está en el inventario." };
  const candidatos = await productModel
    .find({ name: { $regex: escaparRegex(texto.split(/\s+/)[0]), $options: "i" } }, "name stock maxQuantity salePrice priceCost unidadVenta isActive")
    .limit(50);
  const producto = candidatos.find((p) => aPlano(p.name) === aPlano(texto));
  if (!producto) return { error: `No encuentro "${texto}" en el inventario. Dime el nombre exacto.` };
  return { producto };
};

const buscarPromo = async (titulo) => {
  const texto = aPlano(titulo);
  if (!texto) return { error: "¿Cuál promoción? Dime su nombre." };
  const promos = await promotionModel.find({}, "title etiqueta isActive endsAt avisoEnviadoEn");
  const promo = promos.find((p) => aPlano(p.title) === texto || aPlano(p.etiqueta) === texto);
  if (!promo) return { error: `No encuentro la promoción "${titulo}". Dime su nombre como está en Promociones.` };
  return { promo };
};

const nombreCliente = (pedido) => String(pedido.clientId?.fullName || "").trim().split(/\s+/)[0] || "";

/*
 * Revisa que el cambio tenga sentido con lo que hay AHORA y lo describe.
 * Devuelve { ok: true, cambio, resumen } o { ok: false, mensaje }.
 * `cambio` es lo mínimo para aplicarlo después (ids, no nombres).
 */
export const proponerCambio = async (args, { esAdmin }) => {
  const tipo = args.cambio;
  const permitidos = esAdmin ? CAMBIOS_ADMIN : CAMBIOS_EMPLEADO;
  if (!permitidos.includes(tipo)) {
    return { ok: false, mensaje: "Eso solo lo puede cambiar el administrador." };
  }

  switch (tipo) {
    case "estado_pedido": {
      const { pedido, error } = await buscarPedido(args.pedido);
      if (error) return { ok: false, mensaje: error };
      const estado = args.estado_nuevo;
      const numero = `#${codigoDePedido(pedido._id)}`;
      const de = nombreCliente(pedido) ? ` de ${nombreCliente(pedido)}` : "";

      if (!ESTADOS_DESTINO.includes(estado)) return { ok: false, mensaje: `¿A qué estado paso el pedido ${numero}?` };
      if (pedido.status === estado) return { ok: false, mensaje: `El pedido ${numero} ya está ${NOMBRE_ESTADO[estado]}.` };
      if (["entregado", "cancelado"].includes(pedido.status)) {
        return { ok: false, mensaje: `El pedido ${numero} ya está ${NOMBRE_ESTADO[pedido.status]}. Si hay que corregirlo, hazlo en Pedidos.` };
      }
      // Los mismos caminos que la pantalla de Pedidos (ver utils/pasosPedido.js del frontend).
      if (estado === "en_camino" && pedido.deliveryType !== "delivery") {
        return { ok: false, mensaje: `El pedido ${numero} es para recoger en la tienda: no sale en camino. Puede pasar a listo para recoger.` };
      }
      if (estado === "listo" && pedido.deliveryType === "delivery") {
        return { ok: false, mensaje: `El pedido ${numero} es a domicilio: no se marca listo para recoger. Puede pasar a en camino.` };
      }
      if (estado === "entregado" && pedido.deliveryCode) {
        const codigo = String(args.codigo_entrega || "").replace(/\D/g, "");
        if (!codigo) {
          return { ok: false, mensaje: `Para entregar el pedido ${numero} necesito los 4 dígitos que${de ? ` ${nombreCliente(pedido)}` : " el cliente"} ve en su pedido.` };
        }
        if (!codigoCoincide(pedido.deliveryCode, codigo)) {
          return { ok: false, mensaje: `Ese código no coincide con el del pedido ${numero}. Pídele otra vez los 4 dígitos.` };
        }
        return {
          ok: true,
          cambio: { tipo, pedidoId: String(pedido._id), estado, codigo },
          resumen: `Marco el pedido ${numero}${de} como entregado, con el código correcto.`,
        };
      }
      return {
        ok: true,
        cambio: { tipo, pedidoId: String(pedido._id), estado },
        resumen: `Paso el pedido ${numero}${de} de ${NOMBRE_ESTADO[pedido.status]} a ${NOMBRE_ESTADO[estado]}.` +
          (estado === "cancelado" ? " Al cliente le llega el aviso de que se canceló." : ""),
      };
    }

    case "existencias": {
      const { producto, error } = await buscarProducto(args.producto);
      if (error) return { ok: false, mensaje: error };
      const modo = ["fijar", "sumar", "restar"].includes(args.modo) ? args.modo : "fijar";
      const cantidad = Number(args.cantidad);
      if (!(cantidad >= 0) || cantidad > 100000) return { ok: false, mensaje: `¿Cuántas unidades de ${producto.name}?` };
      const libra = producto.unidadVenta === "libra";
      const cant = libra ? Math.round(cantidad * 100) / 100 : Math.round(cantidad);
      const unidad = libra ? "libras" : "unidades";
      const ahora = Number(producto.stock) || 0;
      const queda = modo === "fijar" ? cant : Math.max(0, modo === "sumar" ? ahora + cant : ahora - cant);
      const accion = modo === "fijar" ? `Dejo ${producto.name} en ${cant} ${unidad}`
        : modo === "sumar" ? `Sumo ${cant} ${unidad} a ${producto.name}` : `Resto ${cant} ${unidad} a ${producto.name}`;
      return {
        ok: true,
        cambio: { tipo, productoId: String(producto._id), modo, cantidad: cant },
        resumen: `${accion}: tiene ${ahora} y quedaría en ${Math.round(queda * 100) / 100}.`,
      };
    }

    case "precio": {
      const { producto, error } = await buscarProducto(args.producto);
      if (error) return { ok: false, mensaje: error };
      const precio = Math.round(Number(args.precio) * 100) / 100;
      if (!(precio > 0) || precio > 100000) return { ok: false, mensaje: `¿A qué precio dejo ${producto.name}?` };
      const costo = Number(producto.priceCost) || 0;
      const libra = producto.unidadVenta === "libra" ? " la libra" : "";
      return {
        ok: true,
        cambio: { tipo, productoId: String(producto._id), precio },
        resumen: `Cambio el precio de ${producto.name} de ${plata(producto.salePrice)} a ${plata(precio)}${libra}.` +
          (costo && precio < costo ? ` Ojo: queda por debajo de lo que cuesta, ${plata(costo)}.` : ""),
      };
    }

    case "mostrar_producto":
    case "ocultar_producto": {
      const { producto, error } = await buscarProducto(args.producto);
      if (error) return { ok: false, mensaje: error };
      const activo = tipo === "mostrar_producto";
      if ((producto.isActive !== false) === activo) {
        return { ok: false, mensaje: `${producto.name} ya está ${activo ? "a la vista en la tienda" : "oculto"}.` };
      }
      return {
        ok: true,
        cambio: { tipo, productoId: String(producto._id), activo },
        resumen: activo
          ? `Vuelvo a poner ${producto.name} a la vista en la tienda.`
          : `Oculto ${producto.name} de la tienda. No se borra: vuelve cuando me lo pidas.`,
      };
    }

    case "activar_promocion":
    case "desactivar_promocion": {
      const { promo, error } = await buscarPromo(args.promocion);
      if (error) return { ok: false, mensaje: error };
      const activa = tipo === "activar_promocion";
      const nombre = promo.title || promo.etiqueta;
      if (activa && promo.endsAt && new Date(promo.endsAt) <= new Date()) {
        return { ok: false, mensaje: `${nombre} ya venció. Para volver a usarla, cámbiale la fecha en Promociones.` };
      }
      if ((promo.isActive !== false) === activa) {
        return { ok: false, mensaje: `${nombre} ya está ${activa ? "encendida" : "apagada"}.` };
      }
      return {
        ok: true,
        cambio: { tipo, promoId: String(promo._id), activa },
        resumen: activa ? `Enciendo la promoción ${nombre} en la tienda.` : `Apago la promoción ${nombre}: deja de salir en la tienda.`,
      };
    }

    case "temporada": {
      const ajustes = await storeSettingsModel.findOne({ clave: CLAVE_UNICA }, "temporada").lean();
      const lista = temporadasDisponibles(ajustes?.temporada);
      const pedida = aPlano(args.temporada);
      if (["automatica", "automatico"].includes(pedida)) {
        return { ok: true, cambio: { tipo, modo: "automatico", tema: "" }, resumen: "Dejo la temporada en automática: la tienda se pinta sola según la fecha." };
      }
      if (["ninguna", "ninguno"].includes(pedida)) {
        return { ok: true, cambio: { tipo, modo: "ninguno", tema: "" }, resumen: "Quito la temporada: la tienda queda con sus colores de siempre." };
      }
      const tema = lista.find((t) => aPlano(t.clave) === pedida || aPlano(t.nombre) === pedida);
      if (!tema) {
        return { ok: false, mensaje: `Esa temporada no la tengo. Puedo poner ${lista.map((t) => t.nombre).join(", ")}, la automática o ninguna.` };
      }
      return { ok: true, cambio: { tipo, modo: "manual", tema: tema.clave }, resumen: `Pongo la temporada de ${tema.nombre} en la tienda, sin importar la fecha.` };
    }

    default:
      return { ok: false, mensaje: "Eso todavía no lo puedo cambiar yo. Te abro la pantalla donde se hace." };
  }
};

/*
 * La propuesta firmada: lo que se va a aplicar, quién lo pidió y hasta cuándo
 * vale. El navegador (o la app) solo la guarda y la devuelve si la persona
 * dice que sí; no puede cambiarle nada sin romper la firma.
 */
const PROPOSITO = "tiqui-panel-cambio";

export const firmarPropuesta = (cambio, usuario) =>
  jsonwebtoken.sign({ proposito: PROPOSITO, usuario: String(usuario.id), cambio }, config.JWT.secret, { expiresIn: "5m" });

export const leerPropuesta = (token, usuario) => {
  try {
    const datos = jsonwebtoken.verify(String(token || ""), config.JWT.secret);
    if (datos.proposito !== PROPOSITO || datos.usuario !== String(usuario.id)) return null;
    return datos.cambio;
  } catch {
    return null;
  }
};

/*
 * Aplica un cambio ya confirmado. Se vuelve a validar desde cero con
 * proponerCambio (el pedido pudo moverse, la promo pudo apagarse) y se aplica
 * con la misma lógica que las pantallas. Devuelve { ok, mensaje }.
 */
export const aplicarCambio = async (cambio, { esAdmin, nombre }) => {
  const permitidos = esAdmin ? CAMBIOS_ADMIN : CAMBIOS_EMPLEADO;
  if (!cambio || !permitidos.includes(cambio.tipo)) {
    return { ok: false, mensaje: "Eso solo lo puede cambiar el administrador." };
  }

  let mensaje = "";
  switch (cambio.tipo) {
    case "estado_pedido": {
      const pedido = await orderModel.findById(cambio.pedidoId).select("+deliveryCode").populate("clientId", "fullName");
      if (!pedido) return { ok: false, mensaje: "Ese pedido ya no existe." };
      // Revalidar con lo de ahora: en estos segundos otro pudo moverlo.
      const revision = await proponerCambio(
        { cambio: "estado_pedido", pedido: codigoDePedido(pedido._id), estado_nuevo: cambio.estado, codigo_entrega: cambio.codigo },
        { esAdmin }
      );
      if (!revision.ok) return { ok: false, mensaje: revision.mensaje };
      const r = await cambiarEstadoDePedido({
        id: cambio.pedidoId,
        status: cambio.estado,
        // Queda escrito quién lo movió, y que fue por Tiqui.
        quien: `${nombre || "Personal"} (con Tiqui)`,
        codigoEntrega: cambio.codigo,
      });
      if (!r.ok) return { ok: false, mensaje: r.message };
      mensaje = `Listo, el pedido #${codigoDePedido(pedido._id)} quedó ${NOMBRE_ESTADO[cambio.estado]}.`;
      break;
    }

    case "existencias": {
      const producto = await productModel.findById(cambio.productoId);
      if (!producto) return { ok: false, mensaje: "Ese producto ya no existe." };
      const ahora = Number(producto.stock) || 0;
      const libra = producto.unidadVenta === "libra";
      const bruto = cambio.modo === "fijar" ? cambio.cantidad
        : cambio.modo === "sumar" ? ahora + cambio.cantidad : ahora - cambio.cantidad;
      const stock = Math.max(0, libra ? Math.round(bruto * 100) / 100 : Math.round(bruto));
      // Igual que al editarlo en Inventario: el máximo nunca queda por debajo de lo que hay.
      const maxQuantity = Math.max(stock, Number(producto.maxQuantity) || 0);
      await productModel.updateOne({ _id: producto._id }, { $set: { stock, maxQuantity } });
      mensaje = `Listo, ${producto.name} quedó en ${stock} ${libra ? "libras" : "unidades"}.`;
      break;
    }

    case "precio": {
      const producto = await productModel.findById(cambio.productoId);
      if (!producto) return { ok: false, mensaje: "Ese producto ya no existe." };
      await productModel.updateOne({ _id: producto._id }, { $set: { salePrice: cambio.precio } });
      mensaje = `Listo, ${producto.name} ahora cuesta ${plata(cambio.precio)}.`;
      break;
    }

    case "mostrar_producto":
    case "ocultar_producto": {
      const producto = await productModel.findById(cambio.productoId);
      if (!producto) return { ok: false, mensaje: "Ese producto ya no existe." };
      await productModel.updateOne({ _id: producto._id }, { $set: { isActive: cambio.activo } });
      mensaje = cambio.activo ? `Listo, ${producto.name} ya sale en la tienda.` : `Listo, ${producto.name} ya no sale en la tienda.`;
      break;
    }

    case "activar_promocion":
    case "desactivar_promocion": {
      const promo = await promotionModel.findById(cambio.promoId);
      if (!promo) return { ok: false, mensaje: "Esa promoción ya no existe." };
      if (cambio.activa && promo.endsAt && new Date(promo.endsAt) <= new Date()) {
        return { ok: false, mensaje: "Esa promoción ya venció. Cámbiale la fecha en Promociones." };
      }
      await promotionModel.updateOne({ _id: promo._id }, { $set: { isActive: cambio.activa } });
      /*
       * La promo que se enciende por primera vez se anuncia, igual que al
       * encenderla desde la pantalla de Promociones (promotionController): el
       * propio aviso revisa que no se haya mandado antes.
       */
      if (cambio.activa && !promo.avisoEnviadoEn) avisarPromoNuevaEnSegundoPlano(String(promo._id));
      mensaje = `Listo, la promoción ${promo.title || promo.etiqueta} quedó ${cambio.activa ? "encendida" : "apagada"}.`;
      break;
    }

    case "temporada": {
      // Por ruta ("temporada.modo"), como en storeSettingsController: un $set del
      // subdocumento entero borraría los saludos y las temporadas propias.
      await storeSettingsModel.updateOne(
        { clave: CLAVE_UNICA },
        { $set: { "temporada.modo": cambio.modo, "temporada.tema": cambio.tema } }
      );
      mensaje = cambio.modo === "automatico" ? "Listo, la temporada quedó en automática."
        : cambio.modo === "ninguno" ? "Listo, la tienda quedó con sus colores de siempre."
        : "Listo, ya cambié la temporada de la tienda.";
      break;
    }

    default:
      return { ok: false, mensaje: "Eso todavía no lo puedo cambiar yo." };
  }

  olvidarPanorama();
  return { ok: true, mensaje };
};
