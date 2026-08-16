/*
Campos:
    fullnName: String,
    dui: String,
    phoneNumber: String,
    image: String,
    email: String,
    userName: String,
    password: String,
    isActive: Boolean,
*/

import{ Schema, model } from 'mongoose';

const employeeSchema = new Schema({
    fullnName: { type:"String"},
    dui: { type:"String"},
    phoneNumber: { type:"String"},
    image: { type:"String"},
    public_id: { type:"String"},
    email: { type:"String"},
    userName: { type:"String"},
    password: { type:"String"},
    isActive: { type:"Boolean", default:true},

    // Bloqueo por intentos fallidos al iniciar sesión — igual que el admin.
    loginAttemps: { type: Number, default: 0 },
    timeOut: { type: Date, default: null },
},
{
    timestamps: true,
    strict: false
}
);

export default model('employeeModel', employeeSchema, "Employees");