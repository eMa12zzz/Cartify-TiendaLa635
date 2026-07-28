import mongoose, { Schema, model } from "mongoose";

/*
 * ============================================================
 * VALORACIONES — review.js
 * ============================================================
 * Lo que opinan los clientes de un producto.
 *
 * Antes la tienda mostraba reseñas inventadas: un 4.3 fijo, "5,961 reseñas" y
 * dos comentarios firmados por gente que no existe, iguales en TODOS los
 * productos. Eso no es una maqueta inofensiva: son opiniones falsas puestas
 * frente a alguien que está decidiendo si compra.
 *
 * Reglas que sostienen que esto valga algo:
 *   - Solo valora quien compró el producto (se verifica contra sus pedidos).
 *   - Una valoración por persona y producto (índice único); si vuelve a
 *     opinar, se actualiza la suya en lugar de sumar otra.
 * ============================================================
 */
const reviewSchema = new Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "productModel", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "clientModel", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

// Una por cliente y producto: sin esto, alguien podría inflar su propio 5★.
reviewSchema.index({ productId: 1, clientId: 1 }, { unique: true });

export default model("reviewModel", reviewSchema, "Reviews");
