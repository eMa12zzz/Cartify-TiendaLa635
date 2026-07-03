/*
Campos:
    email: String,
    userName: String,
    password: String,
    isActive: Boolean,
*/

import{ Schema, model } from 'mongoose';

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
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