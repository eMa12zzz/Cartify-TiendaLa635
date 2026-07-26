import orderModel from "../models/order.js";
import productModel from "../models/product.js";
import shoppingModel from "../models/shoppings.js";
import clientModel from "../models/client.js";

/*
 * Dashboard del admin — arma TODO el resumen en una sola llamada.
 * La idea es que no sean números bonitos, sino cosas accionables: qué reponer,
 * qué caduca, qué preparar y qué ya no se vende.
 */

/*
 * Umbrales del negocio.
 * "Stock bajo" NO es un número fijo: depende del máximo de cada producto.
 * No es lo mismo que queden 10 refrescos de un máximo de 1000 (crítico) que
 * 10 televisores de un máximo de 12 (normal). Por eso comparamos contra su
 * propio maxQuantity; si el producto no lo tiene, usamos el respaldo fijo.
 */
const RATIO_BAJO = 0.25;      // le queda 25% o menos de su máximo
const STOCK_BAJO_ABS = 10;    // respaldo cuando no hay máximo definido
const DIAS_CADUCA = 7;        // "caduca esta semana"

/*
 * Convierte un campo a número dentro de la consulta. Hace falta porque algunos
 * productos guardaron stock/maxQuantity como texto (vienen de un formulario con
 * archivos), y Mongo no puede multiplicar cadenas.
 */
const numero = (campo) => ({ $convert: { input: campo, to: "double", onError: 0, onNull: 0 } });

// Condición de "stock bajo" relativa al máximo de cada producto.
const filtroStockBajo = {
  isActive: { $ne: false },
  $expr: {
    $lte: [
      numero("$stock"),
      {
        $cond: [
          { $gt: [numero("$maxQuantity"), 0] },
          { $multiply: [numero("$maxQuantity"), RATIO_BAJO] },
          STOCK_BAJO_ABS,
        ],
      },
    ],
  },
};

/*
 * Serie de la gráfica (ventas vs compras). Vive aparte porque el front la pide
 * sola cuando cambias de Semana/Mes/Año — así no recarga todo el dashboard.
 */
const construirSerie = async (periodo, desde) => {
  const porDia = periodo === "semana";
  const formato = porDia ? "%d/%m" : "%Y-%m";

  const [serieVentas, serieCompras] = await Promise.all([
    orderModel.aggregate([
      { $match: { status: { $ne: "cancelado" }, createdAt: { $gte: desde } } },
      { $group: { _id: { $dateToString: { format: formato, date: "$createdAt" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } },
    ]),
    shoppingModel.aggregate([
      { $match: { date: { $gte: desde } } },
      { $group: { _id: { $dateToString: { format: formato, date: "$date" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const etiquetas = Array.from(
    new Set([...serieVentas.map((s) => s._id), ...serieCompras.map((s) => s._id)])
  ).sort();

  return etiquetas.map((etiqueta) => ({
    etiqueta,
    ventas: Number((serieVentas.find((s) => s._id === etiqueta)?.total || 0).toFixed(2)),
    compras: Number((serieCompras.find((s) => s._id === etiqueta)?.total || 0).toFixed(2)),
  }));
};

// Desde qué fecha arranca la serie según el periodo elegido.
const inicioSerie = (periodo, hoy) => {
  const desde = new Date(hoy);
  if (periodo === "semana") desde.setDate(desde.getDate() - 6);
  else desde.setMonth(desde.getMonth() - (periodo === "anio" ? 11 : 5));
  return desde;
};

const inicioDelDia = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Variación porcentual entre dos periodos (protegida contra dividir entre 0).
const variacion = (actual, anterior) => {
  if (!anterior) return actual > 0 ? 100 : 0;
  return Math.round(((actual - anterior) / anterior) * 100);
};

const dashboardController = {};

dashboardController.getSummary = async (req, res) => {
  try {
    const periodo = req.query.periodo || "mes"; // 'semana' | 'mes' | 'anio'

    const ahora = new Date();
    const hoy = inicioDelDia(ahora);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    const hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 7);
    const hace14 = new Date(hoy); hace14.setDate(hace14.getDate() - 14);
    const hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30);
    const caducaHasta = new Date(ahora); caducaHasta.setDate(caducaHasta.getDate() + DIAS_CADUCA);

    const noCancelado = { status: { $ne: "cancelado" } };

    const [
      pedidosHoy, pedidosAyer,
      dineroHoy, dineroAyer,
      entregadosSemana, entregadosSemanaPrevia,
      productosPorReponer, lotesPorCaducar,
      pedidosPorPreparar, impresionesPendientes,
      clientesNuevos, canjes,
      masVendidos, ventasPorModulo,
      grafica,
      totalProductos, totalClientes,
    ] = await Promise.all([
      // ── Pedidos de hoy vs ayer ──
      orderModel.countDocuments({ createdAt: { $gte: hoy, $lt: manana } }),
      orderModel.countDocuments({ createdAt: { $gte: ayer, $lt: hoy } }),

      // ── Ganancia del día vs ayer ──
      orderModel.aggregate([
        { $match: { ...noCancelado, createdAt: { $gte: hoy, $lt: manana } } },
        { $group: { _id: null, total: { $sum: "$total" }, cantidad: { $sum: 1 } } },
      ]),
      orderModel.aggregate([
        { $match: { ...noCancelado, createdAt: { $gte: ayer, $lt: hoy } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // ── Entregados esta semana vs la anterior (por fecha de entrega) ──
      orderModel.countDocuments({ status: "entregado", updatedAt: { $gte: hace7 } }),
      orderModel.countDocuments({ status: "entregado", updatedAt: { $gte: hace14, $lt: hace7 } }),

      // ── Por reponer (bajo respecto a SU propio máximo) ──
      productModel
        .find(filtroStockBajo)
        .select("name stock maxQuantity salePrice")
        .sort({ stock: 1 })
        .limit(50),

      // ── Lotes que caducan esta semana ──
      productModel
        .find({ isActive: { $ne: false }, expirationDate: { $gte: ahora, $lte: caducaHasta } })
        .select("name expirationDate stock")
        .sort({ expirationDate: 1 })
        .limit(50),

      // ── Trabajo pendiente ──
      orderModel.countDocuments({ status: { $in: ["pagado", "preparando"] } }),
      orderModel.countDocuments({ channel: "impresion", status: { $in: ["pagado", "preparando"] } }),

      // ── Clientes nuevos esta semana ──
      clientModel.countDocuments({ createdAt: { $gte: hace7 } }),

      // ── Puntos canjeados en los últimos 30 días ──
      orderModel.aggregate([
        { $match: { createdAt: { $gte: hace30 } } },
        { $group: { _id: null, puntos: { $sum: "$pointsRedeemed" }, descuento: { $sum: "$discount" } } },
      ]),

      // ── Productos más vendidos ──
      orderModel.aggregate([
        { $match: noCancelado },
        { $unwind: "$items" },
        { $match: { "items.productId": { $ne: null } } },
        {
          $group: {
            _id: "$items.productId",
            vendidos: { $sum: "$items.amount" },
            ingreso: { $sum: { $multiply: ["$items.price", "$items.amount"] } },
          },
        },
        { $sort: { vendidos: -1 } },
        { $limit: 8 },
        { $lookup: { from: "Products", localField: "_id", foreignField: "_id", as: "p" } },
        { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "ProductTypes", localField: "p.typeId", foreignField: "_id", as: "t" } },
        { $unwind: { path: "$t", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            vendidos: 1, ingreso: 1,
            nombre: "$p.name", stock: "$p.stock", maxQuantity: "$p.maxQuantity",
            precio: "$p.salePrice", categoria: "$t.type",
          },
        },
      ]),

      // ── Ventas por módulo (Tienda, Impresiones, y los que creen) ──
      orderModel.aggregate([
        { $match: noCancelado },
        { $unwind: "$items" },
        { $lookup: { from: "Products", localField: "items.productId", foreignField: "_id", as: "p" } },
        { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "Modules", localField: "p.moduleId", foreignField: "_id", as: "m" } },
        { $unwind: { path: "$m", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$m.name", "Impresiones / otros"] },
            total: { $sum: { $multiply: ["$items.price", "$items.amount"] } },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // ── Gráfica de ventas vs compras ──
      construirSerie(periodo, inicioSerie(periodo, hoy)),

      productModel.countDocuments({ isActive: { $ne: false } }),
      clientModel.countDocuments({ isActive: { $ne: false } }),
    ]);

    // ── Productos sin movimiento (nadie los ha comprado nunca) ──
    const vendidosIds = await orderModel.distinct("items.productId", noCancelado);
    const sinMovimiento = await productModel
      .find({ isActive: { $ne: false }, _id: { $nin: vendidosIds.filter(Boolean) } })
      .select("name stock salePrice")
      .limit(8);

    const gananciaHoy = Number((dineroHoy[0]?.total || 0).toFixed(2));
    const gananciaAyer = Number((dineroAyer[0]?.total || 0).toFixed(2));
    const pedidosConMonto = dineroHoy[0]?.cantidad || 0;

    return res.status(200).json({
      // Tarjetas principales
      pedidosHoy: {
        valor: pedidosHoy,
        variacion: variacion(pedidosHoy, pedidosAyer),
      },
      entregados: {
        valor: entregadosSemana,
        variacion: variacion(entregadosSemana, entregadosSemanaPrevia),
      },
      ganancia: {
        valor: gananciaHoy,
        delta: Number((gananciaHoy - gananciaAyer).toFixed(2)),
      },
      ticketPromedio: pedidosConMonto ? Number((gananciaHoy / pedidosConMonto).toFixed(2)) : 0,

      // Requiere atención
      porReponer: { total: productosPorReponer.length, lista: productosPorReponer },
      porCaducar: { total: lotesPorCaducar.length, lista: lotesPorCaducar },
      pedidosPorPreparar,
      impresionesPendientes,

      // Extras
      clientesNuevos,
      puntosCanjeados: canjes[0]?.puntos || 0,
      descuentoPorPuntos: Number((canjes[0]?.descuento || 0).toFixed(2)),
      totalProductos,
      totalClientes,

      // Tablas y gráficas
      masVendidos,
      sinMovimiento,
      ventasPorModulo: ventasPorModulo.map((m) => ({ modulo: m._id, total: Number(m.total.toFixed(2)) })),
      grafica,
      periodo,
      umbrales: { ratioBajo: RATIO_BAJO, stockBajoAbs: STOCK_BAJO_ABS, diasCaduca: DIAS_CADUCA },
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/*
 * Solo la gráfica. Lo usa el front al cambiar Semana/Mes/Año, para no volver a
 * pedir (ni repintar) todo el dashboard por un cambio que afecta una sola caja.
 */
dashboardController.getChart = async (req, res) => {
  try {
    const periodo = req.query.periodo || "mes";
    const hoy = inicioDelDia(new Date());
    const grafica = await construirSerie(periodo, inicioSerie(periodo, hoy));
    return res.status(200).json({ grafica, periodo });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default dashboardController;
