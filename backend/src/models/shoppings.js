/**
 * @swagger
 * components:
 *   schemas:
 *     ShoppingProductItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: ObjectId del producto comprado (ref Products).
 *           example: 68932f1a2b3c4d5e6f7a8b9c
 *         amount:
 *           type: number
 *           example: 100
 *         price:
 *           type: number
 *           description: Precio de costo unitario de esta compra.
 *           example: 2500
 *       required:
 *         - productId
 *         - amount
 *         - price
 *     Shopping:
 *       type: object
 *       description: Compra de inventario a un proveedor (reabastecimiento). Distinto de Order, que es la venta al cliente.
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b90
 *         supplierId:
 *           type: string
 *           description: ObjectId del proveedor (ref Suppliers).
 *         date:
 *           type: string
 *           format: date
 *         total:
 *           type: number
 *           example: 250000
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShoppingProductItem'
 *       required:
 *         - supplierId
 *         - date
 *         - total
 *         - products
 *     ShoppingInput:
 *       type: object
 *       properties:
 *         supplierId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         total:
 *           type: number
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShoppingProductItem'
 *       required:
 *         - supplierId
 *         - date
 *         - total
 *         - products
 */

import mongoose, {Schema, model} from "mongoose";

const shoppingSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suppliers",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products", 
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        }
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default model('shoppingsModel', shoppingSchema, 'Shoppings');