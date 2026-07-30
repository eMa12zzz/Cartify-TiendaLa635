import mongoose, { model } from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clients",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1, // mínimo 1 estrella
      max: 5, // máximo 5 estrellas
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("reviewsModel", reviewSchema, "Reviews");