/*
Campos:
    email: String,
    userName: String,
    password: String,
    image: String,       // foto de perfil (Cloudinary)
    public_id: String,   // id de esa foto en Cloudinary, para poder reemplazarla
    isActive: Boolean,
*/

import{ Schema, model } from 'mongoose';

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    // Foto de perfil, opcional: sin ella el avatar muestra las iniciales.
    image: { type: String },
    public_id: { type: String },
    isActive: { type: Boolean, default: true },

    loginAttemps: {
      type: Number,
      default: 0,
    },

    timeOut: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("adminModel", adminSchema, "Admins");