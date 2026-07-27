import supplierMovementModel from "../models/supplierMovement.js";
import supplierModel from "../models/supplier.js";
import { estadoCuenta, creditoDisponible } from "../utils/cuentaProveedor.js";

const supplierCreditController = {};

/* ── Estado de cuenta de UN proveedor ── */
supplierCreditController.getAccount = async (req, res) => {
  try {
    const proveedor = await supplierModel.findById(req.params.supplierId);
    if (!proveedor) return res.status(404).json({ message: "Proveedor no encontrado" });

    const movimientos = await supplierMovementModel
      .find({ supplierId: req.params.supplierId })
      .sort({ date: -1, createdAt: -1 });

    const cuenta = estadoCuenta(movimientos);

    return res.status(200).json({
      supplier: {
        _id: proveedor._id,
        name: proveedor.name,
        creditLimit: Number(proveedor.creditLimit) || 0,
        creditDays: Number(proveedor.creditDays) || 0,
      },
      ...cuenta,
      disponible: creditoDisponible(proveedor.creditLimit, cuenta.deuda),
      movimientos,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Resumen de TODOS: para el listado y el aviso del dashboard ── */
supplierCreditController.getSummary = async (req, res) => {
  try {
    const proveedores = await supplierModel.find();
    const todos = await supplierMovementModel.find();

    // Agrupamos en memoria: son pocos proveedores y así se reutiliza la misma
    // función de cálculo que la vista individual, sin duplicar la lógica en
    // una agregación de Mongo que después habría que mantener en dos lugares.
    const porProveedor = new Map();
    todos.forEach((m) => {
      const k = String(m.supplierId);
      if (!porProveedor.has(k)) porProveedor.set(k, []);
      porProveedor.get(k).push(m);
    });

    const resumen = proveedores.map((p) => {
      const cuenta = estadoCuenta(porProveedor.get(String(p._id)) || []);
      return {
        _id: p._id,
        name: p.name,
        creditLimit: Number(p.creditLimit) || 0,
        creditDays: Number(p.creditDays) || 0,
        deuda: cuenta.deuda,
        montoVencido: cuenta.montoVencido,
        montoPorVencer: cuenta.montoPorVencer,
        facturasPendientes: cuenta.pendientes.length,
        disponible: creditoDisponible(p.creditLimit, cuenta.deuda),
      };
    });

    // Los que deben más arriba; dentro de esos, primero los que tienen vencido.
    resumen.sort((a, b) => b.montoVencido - a.montoVencido || b.deuda - a.deuda);

    const totales = resumen.reduce(
      (acc, r) => ({
        deuda: acc.deuda + r.deuda,
        vencido: acc.vencido + r.montoVencido,
        porVencer: acc.porVencer + r.montoPorVencer,
      }),
      { deuda: 0, vencido: 0, porVencer: 0 }
    );

    return res.status(200).json({
      proveedores: resumen,
      totales: {
        deuda: Number(totales.deuda.toFixed(2)),
        vencido: Number(totales.vencido.toFixed(2)),
        porVencer: Number(totales.porVencer.toFixed(2)),
      },
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Registrar una compra al crédito o un pago ── */
supplierCreditController.insertMovement = async (req, res) => {
  try {
    const { supplierId, type, amount, date, dueDate, reference, note, shoppingId } = req.body;

    if (!supplierId || !type) {
      return res.status(400).json({ message: "Proveedor y tipo son requeridos" });
    }
    if (!["compra", "pago"].includes(type)) {
      return res.status(400).json({ message: "El tipo debe ser 'compra' o 'pago'" });
    }

    const monto = Number(amount);
    if (!monto || monto <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor que 0" });
    }

    const proveedor = await supplierModel.findById(supplierId);
    if (!proveedor) return res.status(404).json({ message: "Proveedor no encontrado" });

    const fecha = date ? new Date(date) : new Date();

    /*
     * Si es compra al crédito y no dijeron cuándo vence, lo calculamos con el
     * plazo del proveedor. Es lo que el tendero espera: registra la factura y
     * el sistema ya sabe que "a 30 días" vence tal fecha.
     */
    let vence = dueDate ? new Date(dueDate) : null;
    if (type === "compra" && !vence) {
      const dias = Number(proveedor.creditDays) || 0;
      if (dias > 0) {
        vence = new Date(fecha);
        vence.setDate(vence.getDate() + dias);
      }
    }

    const movimiento = await new supplierMovementModel({
      supplierId,
      type,
      amount: monto,
      date: fecha,
      dueDate: type === "compra" ? vence : undefined,
      reference,
      note,
      shoppingId: shoppingId || undefined,
    }).save();

    // Devolvemos la cuenta ya recalculada para que la pantalla no tenga que
    // pedirla otra vez.
    const movimientos = await supplierMovementModel.find({ supplierId });
    const cuenta = estadoCuenta(movimientos);

    return res.status(201).json({
      message: type === "compra" ? "Compra registrada" : "Pago registrado",
      movimiento,
      deuda: cuenta.deuda,
      disponible: creditoDisponible(proveedor.creditLimit, cuenta.deuda),
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Borrar un movimiento mal registrado ── */
supplierCreditController.deleteMovement = async (req, res) => {
  try {
    const movimiento = await supplierMovementModel.findByIdAndDelete(req.params.id);
    if (!movimiento) return res.status(404).json({ message: "Movimiento no encontrado" });
    return res.status(200).json({ message: "Movimiento eliminado" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Actualizar el límite de crédito del proveedor ── */
supplierCreditController.updateLimit = async (req, res) => {
  try {
    const limite = Number(req.body.creditLimit);
    if (Number.isNaN(limite) || limite < 0) {
      return res.status(400).json({ message: "El límite debe ser 0 o mayor" });
    }
    const dias = req.body.creditDays !== undefined ? String(req.body.creditDays) : undefined;

    const proveedor = await supplierModel.findByIdAndUpdate(
      req.params.supplierId,
      { $set: { creditLimit: limite, ...(dias !== undefined ? { creditDays: dias } : {}) } },
      { new: true }
    );
    if (!proveedor) return res.status(404).json({ message: "Proveedor no encontrado" });

    return res.status(200).json({ message: "Crédito actualizado", supplier: proveedor });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default supplierCreditController;
