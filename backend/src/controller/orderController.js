import { isValidObjectId } from "mongoose";
import orderModel from "../models/order.js";
import clientModel from "../models/client.js";
import loyaltyConfigModel from "../models/loyaltyConfig.js";
import loyaltyLedgerModel from "../models/loyaltyLedger.js";
import printServiceModel from "../models/printService.js";
import productModel from "../models/product.js";
import { sendPrintToPrinter } from "../utils/sendPrintToPrinter.js";
import { getLoyaltyConfig, puntosDisponibles, consumirPuntos } from "../utils/loyaltyPoints.js";
import { calcularPrecioImpresion } from "../utils/precioImpresion.js";

const orderController = {};

// INSERT — Crear un pedido (checkout). Aquí es donde se otorgan los puntos.
orderController.createOrder = async (req, res) => {
  try {
    const {
      clientId, items, paymentMethod, channel, pointsToRedeem,
      deliveryType, deliveryAddress, deliveryReference, deliveryLat, deliveryLng,
    } = req.body;

    // Validación básica: sin cliente o sin productos no hay pedido.
    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({
        message: "clientId e items son requeridos"
      });
    }

    /*
     * ── STOCK: validar ANTES de cobrar ──
     * Sin esto se podían pedir 100 unidades de algo que tiene 5. El carrito ya
     * lo revisa, pero el navegador no es de fiar: la comprobación que vale es
     * esta. Los renglones sin productId (las impresiones) se saltan.
     */
    const idsProductos = items.map((it) => it.productId).filter(Boolean);
    const productos = idsProductos.length
      ? await productModel.find({ _id: { $in: idsProductos } })
      : [];
    const porId = new Map(productos.map((p) => [String(p._id), p]));

    for (const it of items) {
      if (!it.productId) continue;
      const producto = porId.get(String(it.productId));
      if (!producto) {
        return res.status(400).json({ message: `El producto "${it.name}" ya no existe` });
      }
      // Ojo: hay productos con el stock guardado como texto (vienen de
      // FormData), por eso el Number() en vez de compararlo directo.
      const disponible = Number(producto.stock) || 0;
      const pedido = Number(it.amount) || 0;
      if (pedido > disponible) {
        return res.status(400).json({
          message: disponible === 0
            ? `"${producto.name}" se acaba de agotar`
            : `Solo quedan ${disponible} de "${producto.name}"`,
        });
      }
    }

    // El subtotal lo calculamos aquí, en el backend. Nunca confiamos en el
    // total que mande el front (podría venir manipulado).
    const subtotal = Number(
      items.reduce((acc, it) => acc + (it.price * it.amount), 0).toFixed(2)
    );

    const config = await getLoyaltyConfig();

    // ── CANJE DE PUNTOS ──
    // Nos protegemos de tres cosas: que no canjee más de lo que tiene, que no
    // canjee más de lo que cuesta la compra, y que respete el mínimo.
    let pointsRedeemed = 0;
    let discount = 0;
    const pedidos = Number(pointsToRedeem) || 0;

    if (pedidos > 0 && config.isActive) {
      const disponibles = await puntosDisponibles(clientId);
      const tasa = config.pointsPerDollarRedeem || 100;
      const topePorCompra = Math.floor(subtotal * tasa); // no regalar más que el total
      const posibles = Math.min(pedidos, disponibles, topePorCompra);

      if (posibles >= (config.minRedeemPoints || 0)) {
        pointsRedeemed = await consumirPuntos(clientId, posibles);
        discount = Number((pointsRedeemed / tasa).toFixed(2));
      }
    }

    const total = Number((subtotal - discount).toFixed(2));

    // Los puntos se ganan sobre lo que REALMENTE se pagó (no sobre el subtotal).
    const pointsEarned = config.isActive
      ? Math.floor(total * config.pointsPerDollar)
      : 0;

    /*
     * ── PAGO CON SALDO ──
     * Va antes de guardar: si no le alcanza, no queremos ni el pedido creado
     * ni los puntos consumidos. El descuento del saldo es condicional
     * ({ balance: { $gte: total } }) para que dos compras simultáneas no
     * puedan gastar el mismo dinero dos veces.
     */
    const metodo = paymentMethod || "efectivo";
    const entrega = deliveryType === "delivery" ? "delivery" : "retiro";

    if (entrega === "delivery" && !deliveryAddress) {
      return res.status(400).json({ message: "Indica la dirección de entrega" });
    }

    if (metodo === "saldo") {
      const cobrado = await clientModel.findOneAndUpdate(
        { _id: clientId, balance: { $gte: total } },
        { $inc: { balance: -total } },
        { new: true }
      );
      if (!cobrado) {
        const cliente = await clientModel.findById(clientId).select("balance");
        return res.status(400).json({
          message: `Saldo insuficiente. Tiene $${(cliente?.balance || 0).toFixed(2)} y el pedido es de $${total.toFixed(2)}`,
        });
      }
    }

    const newOrder = new orderModel({
      clientId,
      items,
      subtotal,
      discount,
      pointsRedeemed,
      total,
      paymentMethod: metodo,
      deliveryType: entrega,
      deliveryAddress: entrega === "delivery" ? deliveryAddress : undefined,
      // La referencia y el punto van con el pedido: sin ellos, quien reparte
      // sale con un texto y sin saber a qué portón tocar.
      deliveryReference: entrega === "delivery" ? deliveryReference : undefined,
      deliveryLat: entrega === "delivery" ? deliveryLat : undefined,
      deliveryLng: entrega === "delivery" ? deliveryLng : undefined,
      channel: channel || "web",
      pointsEarned,
    });

    await newOrder.save();

    /*
     * ── STOCK: descontar ──
     * Va DESPUÉS de guardar el pedido: si algo falla acá, al menos la venta
     * quedó registrada. Al revés (descontar y que falle el pedido) perderíamos
     * inventario sin tener a qué achacárselo.
     *
     * Se usa $set con el número ya calculado y no $inc porque varios productos
     * tienen el stock guardado como texto y $inc revienta con esos. De paso,
     * cada venta va dejando el campo convertido a número.
     */
    for (const it of items) {
      if (!it.productId) continue;
      const producto = porId.get(String(it.productId));
      if (!producto) continue;
      const restante = Math.max(0, (Number(producto.stock) || 0) - (Number(it.amount) || 0));
      try {
        await productModel.findByIdAndUpdate(it.productId, { $set: { stock: restante } });
      } catch (e) {
        console.log("error descontando stock de " + it.productId + ": " + e.message);
      }
    }

    // Si canjeó, le bajamos ese saldo al contador del cliente.
    if (pointsRedeemed > 0) {
      await clientModel.findByIdAndUpdate(clientId, {
        $inc: { loyaltyPoints: -pointsRedeemed }
      });
    }

    // Le sumamos los puntos ganados al cliente ($inc = incremento atómico).
    // client.loyaltyPoints queda como "total acumulado"; el saldo DISPONIBLE
    // real (con vencimiento) sale del ledger de abajo.
    if (pointsEarned > 0) {
      await clientModel.findByIdAndUpdate(clientId, {
        $inc: { loyaltyPoints: pointsEarned }
      });

      // Registramos el LOTE de puntos con su fecha de vencimiento (Parte B).
      const earnedAt = new Date();
      const expiresAt = new Date(earnedAt);
      expiresAt.setMonth(expiresAt.getMonth() + (config.expiryMonths || 3));

      await loyaltyLedgerModel.create({
        clientId,
        points: pointsEarned,
        earnedAt,
        expiresAt,
        orderId: newOrder._id,
      });
    }

    return res.status(201).json({
      message: "Pedido creado",
      order: newOrder,
      pointsEarned,
      pointsRedeemed,
      discount,
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// SELECT — Pedidos de UN cliente (su historial). Alimenta MisPedidos/Recibidos.
orderController.getOrdersByClient = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ clientId: req.params.clientId })
      .sort({ createdAt: -1 })          // los más recientes primero
      .populate("items.productId");

    return res.status(200).json(orders);

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// SELECT — TODOS los pedidos (pantalla del empleado). Filtro opcional ?status=
orderController.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate("clientId", "fullName email phoneNumber")
      .populate("items.productId");

    return res.status(200).json(orders);

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// UPDATE — Cambiar el estado del pedido (preparando, entregado, cancelado).
orderController.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pagado", "preparando", "entregado", "cancelado"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    /*
     * Se sella la hora y el nombre de quien movió el pedido. `quien` lo manda
     * la pantalla del empleado; si no viene, queda el sello de tiempo igual,
     * que es lo que de verdad hace falta para saber cuánto tardó.
     *
     * Solo se escribe la primera vez: si alguien vuelve a marcar "preparando"
     * después de un error, la hora original no se pierde.
     */
    const { quien } = req.body;
    const actual = await orderModel.findById(req.params.id);
    if (!actual) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const cambios = { status };
    if (status === "preparando" && !actual.preparedAt) {
      cambios.preparedAt = new Date();
      cambios.preparedBy = quien || "";
    }
    if (status === "entregado" && !actual.deliveredAt) {
      cambios.deliveredAt = new Date();
      cambios.deliveredBy = quien || "";
    }

    /*
     * Se acabó el viaje, se acaba el rastro. Cuando el pedido llega o se
     * cancela, la posición del repartidor deja de tener sentido para todos:
     * el cliente ya recibió y la tienda no necesita un mapa de por dónde
     * anduvo su empleado. Se borra el punto, no solo se apaga.
     */
    if (status === "entregado" || status === "cancelado") {
      cambios.courier = { active: false };
    }

    const updated = await orderModel.findByIdAndUpdate(
      req.params.id,
      cambios,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    return res.status(200).json({ message: "Estado actualizado", order: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// INSERT — Crear un pedido de IMPRESIÓN (sube archivo + opciones).
orderController.createPrintOrder = async (req, res) => {
  try {
    const { clientId, serviceId, color, copies, pages, doubleSided, paper } = req.body;

    if (!clientId || !serviceId) {
      return res.status(400).json({ message: "clientId y serviceId son requeridos" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Sube el archivo a imprimir" });
    }

    const service = await printServiceModel.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Servicio de impresión no encontrado" });
    }

    const esColor = color === "true" || color === true;
    const nCopias = Number(copies) || 1;
    const nPaginas = Number(pages) || 1;
    const doble = doubleSided === "true" || doubleSided === true;

    /*
     * Antes el precio ignoraba `doble`: se calculaba, se guardaba en el pedido
     * y no tocaba el total, así que elegir doble cara no cambiaba nada. Ahora
     * el cálculo vive en un solo lugar y cobra por hoja, no por página.
     */
    const { total, hojas, precioPorHoja } = calcularPrecioImpresion({
      servicio: service,
      paginas: nPaginas,
      copias: nCopias,
      color: esColor,
      dobleCara: doble,
    });

    // Opción 1: enviar a la impresora por correo (si hay PRINTER_EMAIL).
    // El archivo igual queda guardado en Cloudinary (opción 2 / respaldo).
    let emailed = false;
    try {
      const r = await sendPrintToPrinter({
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        options: { servicio: service.name, color: esColor, copias: nCopias, paginas: nPaginas, doble, paper },
      });
      emailed = !!r.emailed;
    } catch (e) {
      console.log("error enviando a impresora " + e);
    }

    // Puntos de fidelidad, igual que un pedido normal.
    const config = await getLoyaltyConfig();
    const pointsEarned = config.isActive ? Math.floor(total * config.pointsPerDollar) : 0;

    // Resumen con las hojas reales, para que el empleado sepa qué va a salir
    // de la impresora sin tener que abrir el pedido.
    const resumen =
      `Impresión ${service.name} ${esColor ? "a color" : "B/N"}` +
      `${doble ? " doble cara" : ""} x${nCopias}` +
      ` (${nPaginas} pág${nPaginas > 1 ? "s" : ""}, ${hojas} hoja${hojas > 1 ? "s" : ""} a $${precioPorHoja.toFixed(2)})`;

    const newOrder = new orderModel({
      clientId,
      items: [{ name: resumen, price: total, amount: 1 }],
      total,
      status: "pagado",
      paymentMethod: "efectivo",
      channel: "impresion",
      pointsEarned,
      printJob: {
        serviceName: service.name,
        fileUrl: req.file.path,
        public_id: req.file.filename,
        color: esColor,
        copies: nCopias,
        pages: nPaginas,
        doubleSided: doble,
        paper: paper || "",
        emailedToPrinter: emailed,
      },
    });

    await newOrder.save();

    if (pointsEarned > 0) {
      await clientModel.findByIdAndUpdate(clientId, { $inc: { loyaltyPoints: pointsEarned } });
      const earnedAt = new Date();
      const expiresAt = new Date(earnedAt);
      expiresAt.setMonth(expiresAt.getMonth() + (config.expiryMonths || 3));
      await loyaltyLedgerModel.create({ clientId, points: pointsEarned, earnedAt, expiresAt, orderId: newOrder._id });
    }

    return res.status(201).json({
      message: "Pedido de impresión creado",
      order: newOrder,
      emailedToPrinter: emailed,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * UPDATE — El repartidor manda dónde va.
 *
 * Lo llama el teléfono de quien reparte cada pocos segundos mientras dura el
 * viaje. Es la mitad barata del seguimiento en vivo: escribe cuatro números y
 * ya. Con `activo: false` se apaga el compartir sin tener que entregar
 * (se cansó, se le acabó la batería, o se bajó del pedido).
 */
orderController.updateCourierPosition = async (req, res) => {
  try {
    const { lat, lng, quien, activo } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const pedido = await orderModel.findById(req.params.id).select("deliveryType status");
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    if (pedido.deliveryType !== "delivery") {
      return res.status(400).json({ message: "Este pedido no es a domicilio" });
    }
    // Un pedido cerrado no se sigue: si ya llegó o se canceló, no hay viaje.
    if (["entregado", "cancelado"].includes(pedido.status)) {
      return res.status(400).json({ message: "Este pedido ya se cerró" });
    }

    // Apagar el compartir: se borra el punto, no se deja el último quieto.
    if (activo === false) {
      await orderModel.findByIdAndUpdate(req.params.id, { courier: { active: false } });
      return res.status(200).json({ message: "Seguimiento detenido" });
    }

    // El navegador manda números; si llega otra cosa, no la guardamos.
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
      return res.status(400).json({ message: "Coordenadas inválidas" });
    }

    const courier = {
      active: true,
      lat: nLat,
      lng: nLng,
      name: quien || "",
      updatedAt: new Date(),
    };

    await orderModel.findByIdAndUpdate(req.params.id, { courier });

    return res.status(200).json({ message: "Posición actualizada", courier });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * SELECT — Dónde va el repartidor, para el cliente que espera.
 *
 * Devuelve solo el punto y el destino, no el pedido entero: esta ruta se
 * consulta cada pocos segundos y sería un desperdicio arrastrar los productos
 * y los datos del cliente en cada vuelta.
 */
orderController.getCourierPosition = async (req, res) => {
  try {
    /*
     * Un id con mala forma revienta en el casteo de Mongoose y sale como 500.
     * En una ruta que se consulta cada diez segundos eso son cientos de
     * errores en el log tapando los que sí importan: mejor un 404 y ya.
     */
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const pedido = await orderModel
      .findById(req.params.id)
      .select("courier status deliveryType deliveryLat deliveryLng");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    return res.status(200).json({
      status: pedido.status,
      deliveryType: pedido.deliveryType,
      destino: (pedido.deliveryLat != null && pedido.deliveryLng != null)
        ? { lat: pedido.deliveryLat, lng: pedido.deliveryLng }
        : null,
      courier: pedido.courier?.active ? pedido.courier : null,
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * ============================================================
 * SELECT — Cuánto tardamos DE VERDAD en llegar a esta zona.
 * ============================================================
 * Todas las tiendas prometen "30 a 45 minutos" y ese número no sale de
 * ningún lado. Aquí ya tenemos con qué responder de verdad: cada pedido
 * entregado guarda a qué punto fue y a qué hora llegó.
 *
 * Cómo se calcula:
 *   1. Se buscan las entregas pasadas CERCA del punto que preguntan (no por
 *      colonia: los nombres de colonia son un desastre y la gente los
 *      escribe de diez maneras distintas).
 *   2. Se toma la MEDIANA, no el promedio. Un pedido que se quedó olvidado
 *      tres horas un domingo no tiene por qué empeorarle el estimado a todo
 *      el barrio; la mediana lo ignora sin tener que andar borrando datos.
 *   3. Si hay menos de 3 entregas cerca, NO se inventa un número. Se dice
 *      que todavía no hay con qué, que es la verdad.
 *
 * Se miran solo los últimos 90 días: cómo se repartía hace un año no dice
 * nada de cómo se reparte hoy.
 */
const RADIO_ZONA_M = 1500;      // qué tan cerca cuenta como "su zona"
const MINIMO_ENTREGAS = 3;      // menos que esto no es un dato, es una anécdota
const DIAS_DE_HISTORIA = 90;

// Distancia en metros entre dos puntos (Haversine).
const distanciaMetros = (a, b) => {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Percentil de una lista YA ordenada.
const percentil = (ordenados, p) => {
  if (!ordenados.length) return null;
  const i = Math.min(ordenados.length - 1, Math.floor((p / 100) * ordenados.length));
  return ordenados[i];
};

orderController.getTiempoPorZona = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "Se necesitan lat y lng" });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - DIAS_DE_HISTORIA);

    const entregados = await orderModel
      .find({
        status: "entregado",
        deliveryType: "delivery",
        deliveredAt: { $ne: null, $gte: desde },
        deliveryLat: { $ne: null },
        deliveryLng: { $ne: null },
      })
      .select("deliveryLat deliveryLng createdAt deliveredAt");

    const punto = { lat, lng };
    const minutos = [];

    for (const o of entregados) {
      const cerca = distanciaMetros(punto, { lat: o.deliveryLat, lng: o.deliveryLng });
      if (cerca > RADIO_ZONA_M) continue;

      // Lo que le importa al cliente es desde que paga hasta que recibe, no
      // solo el rato que el repartidor anduvo en la calle.
      const tardanza = (new Date(o.deliveredAt) - new Date(o.createdAt)) / 60000;

      /*
       * Se descartan los imposibles: entregas "negativas" (alguien movió el
       * estado a mano) y las de más de 4 horas, que casi siempre son un
       * pedido que se marcó entregado al día siguiente, no un reparto lento.
       */
      if (tardanza > 0 && tardanza < 240) minutos.push(tardanza);
    }

    if (minutos.length < MINIMO_ENTREGAS) {
      return res.status(200).json({
        hayDatos: false,
        entregas: minutos.length,
        message: "Todavía no hay suficientes entregas por esa zona",
      });
    }

    minutos.sort((a, b) => a - b);

    // Se redondea a 5 minutos: dar "27 minutos" finge una precisión que no
    // existe, y la gente lo cobra como promesa.
    const aCinco = (n) => Math.max(5, Math.round(n / 5) * 5);

    return res.status(200).json({
      hayDatos: true,
      entregas: minutos.length,
      tipico: aCinco(percentil(minutos, 50)),  // la mitad llega antes de esto
      holgado: aCinco(percentil(minutos, 80)), // 8 de cada 10 llegan antes
      radioMetros: RADIO_ZONA_M,
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default orderController;
