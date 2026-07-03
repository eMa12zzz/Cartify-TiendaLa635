import mongoose, {Schema, model} from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
   
    productsId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products", 
        required: true,
      }
    ],
    promoDescription: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, 
    }
  },
  {
    timestamps: true, strict: false  }
);

export default model('promotionModel', promotionSchema, 'Promotions');