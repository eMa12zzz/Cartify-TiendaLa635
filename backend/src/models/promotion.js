import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
   
    productsId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", 
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

export default mongoose.model("Promotion", promotionSchema);