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
      required: true,
      default: true, 
    }
  },
  {
    timestamps: true, 
    versionKey: false 
  }
);

export default mongoose.model("Promotion", promotionSchema);