import orderModel from "../models/order.js";
import clientModel from "../models/client.js";
import loyaltyConfigModel from "../models/loyaltyConfig.js";
import loyaltyLedgerModel from "../models/loyaltyLedger.js";

const orderController = {};

/*
 * Helper interno: obtiene la config de puntos y, si todavía no existe ninguna,
 * la crea con los valores por defecto del schema (1 punto/$1, vence a 3 meses).
 * Así nunca truena por "config no encontrada".
 */
const getLoyaltyConfig = async () => {
  let config = await loyaltyConfigModel.findOne();
  if (!config) {
    config = await loyaltyConfigModel.create({});
  }
  return config;
};

// INSERT — Crear un pedido (checkout). Aquí es donde se otorgan los puntos.
orderController.createOrder = async (req, res) => {
  try {
    const { clientId, items, paymentMethod, channel } = req.body;

    // Validación básica: sin cliente o sin productos no hay pedido.
    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({
        message: "clientId e items son requeridos"
      });
    }

    // El total lo calculamos aquí, en el backend. Nunca confiamos en el total
    // que mande el front (podría venir manipulado).
    const total = items.reduce((acc, it) => acc + (it.price * it.amount), 0);

    // Puntos de fidelidad según la config editable. Si el programa está
    // apagado, no se otorgan puntos.
    const config = await getLoyaltyConfig();
    const pointsEarned = config.isActive
      ? Math.floor(total * config.pointsPerDollar)
      : 0;

    const newOrder = new orderModel({
      clientId,
      items,
      total,
      paymentMethod: paymentMethod || "efectivo",
      channel: channel || "web",
      pointsEarned,
    });

    await newOrder.save();

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
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(500).json({ message: "Internal server error" });
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

    const updated = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    return res.status(200).json({ message: "Estado actualizado", order: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default orderController;
