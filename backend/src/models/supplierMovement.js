import mongoose, { Schema, model } from "mongoose";

/*
 * ============================================================
 * MOVIMIENTO DE CUENTA CON UN PROVEEDOR
 * ============================================================
 * La deuda con un proveedor NO se guarda como un número. Se guarda cada
 * movimiento (una compra al crédito suma, un pago resta) y el saldo se calcula
 * sumándolos.
 *
 * Por qué así y no un campo "deuda" en el proveedor:
 *   - Un número no dice CUÁNDO vence cada factura. Con movimientos se puede
 *     avisar "le debe $340, y $120 vencen el viernes".
 *   - Si alguien registra un pago mal, con un número no hay forma de saber qué
 *     pasó; con movimientos se ve el historial y se corrige el movimiento.
 *   - Dos personas registrando cosas a la vez sobre un mismo campo se pisan.
 *     Cada movimiento es su propio documento y no se estorban.
 * ============================================================
 */
const supplierMovementSchema = new Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplierModel",
      required: true,
      index: true,
    },

    // 'compra' suma deuda, 'pago' la resta.
    type: {
      type: String,
      enum: ["compra", "pago"],
      required: true,
    },

    amount: { type: Number, required: true, min: 0.01 },

    // Cuándo ocurrió (puede no ser hoy: se registra una factura de la semana pasada).
    date: { type: Date, default: Date.now },

    // Solo para compras: hasta cuándo hay plazo para pagarla.
    dueDate: { type: Date },

    // Número de factura o recibo, para poder cotejar con el papel.
    reference: { type: String, trim: true },

    note: { type: String, trim: true },

    // Si el movimiento nació de una compra registrada en el sistema.
    shoppingId: { type: mongoose.Schema.Types.ObjectId, ref: "shoppingsModel" },
  },
  { timestamps: true }
);

export default model("supplierMovementModel", supplierMovementSchema, "SupplierMovements");
