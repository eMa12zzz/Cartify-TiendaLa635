import mongoose, { Schema, model } from "mongoose";

/*
 Promoción / Anuncio de la tienda — soporta 3 tipos:
   - 'descuento'    : cada producto con SU % de descuento.       (items[].discount)
   - 'precio_fijo'  : cada producto con un precio fijo de oferta. (items[].fixedPrice)
   - 'nxm'          : compra N, paga M sobre los productos.       (buyQty/payQty)

   items:   productos incluidos (+ su descuento/precio según el tipo).
   image:   banner que sube la tienda (Cloudinary). Click → filtra a estos productos.
*/
const promoItemSchema = new Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    discount: { type: Number, default: 0 },   // % (tipo 'descuento')
    fixedPrice: { type: Number },              // $ (tipo 'precio_fijo')
  },
  { _id: false }
);

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String },
    image: { type: String },
    public_id: { type: String },
    promoDescription: { type: String, required: true },
    type: {
      type: String,
      enum: ["descuento", "precio_fijo", "nxm"],
      default: "descuento",
    },
    items: [promoItemSchema],
    buyQty: { type: Number, default: 2 }, // NxM: compra N
    payQty: { type: Number, default: 1 }, // NxM: paga M
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export default model('promotionModel', promotionSchema, 'Promotions');
