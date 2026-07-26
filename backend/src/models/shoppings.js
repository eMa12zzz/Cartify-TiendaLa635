import mongoose, {Schema, model} from "mongoose";

const shoppingSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supplierModel",
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
          ref: "productModel",
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