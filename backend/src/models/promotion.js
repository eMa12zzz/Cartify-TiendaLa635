/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: ObjectId del producto incluido en la promoción.
 *           example: 68932f1a2b3c4d5e6f7a8b9c
 *         discount:
 *           type: number
 *           description: Porcentaje de descuento (solo tipo "descuento").
 *           example: 15
 *         fixedPrice:
 *           type: number
 *           description: Precio fijo de oferta (solo tipo "precio_fijo").
 *           example: 2999
 *     Promotion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b70
 *         title:
 *           type: string
 *           example: Ofertas de fin de mes
 *         image:
 *           type: string
 *           example: https://res.cloudinary.com/demo/image/upload/v1/promotions/banner.png
 *         promoDescription:
 *           type: string
 *           example: 15% de descuento en productos seleccionados de granos.
 *         type:
 *           type: string
 *           enum: [descuento, precio_fijo, nxm]
 *           default: descuento
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PromotionItem'
 *         buyQty:
 *           type: number
 *           description: Cantidad a comprar (solo tipo "nxm").
 *           default: 2
 *         payQty:
 *           type: number
 *           description: Cantidad a pagar (solo tipo "nxm").
 *           default: 1
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - promoDescription
 *     PromotionInput:
 *       type: object
 *       description: Payload multipart/form-data. "items" viaja como un string JSON serializado, ej. '[{"productId":"...","discount":15}]'.
 *       properties:
 *         title:
 *           type: string
 *         promoDescription:
 *           type: string
 *         type:
 *           type: string
 *           enum: [descuento, precio_fijo, nxm]
 *         items:
 *           type: string
 *           description: JSON.stringify de un arreglo de PromotionItem. Debe tener al menos un elemento.
 *           example: '[{"productId":"68932f1a2b3c4d5e6f7a8b9c","discount":15}]'
 *         buyQty:
 *           type: number
 *         payQty:
 *           type: number
 *         isActive:
 *           type: boolean
 *         image:
 *           type: string
 *           format: binary
 *       required:
 *         - promoDescription
 *         - items
 */

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
