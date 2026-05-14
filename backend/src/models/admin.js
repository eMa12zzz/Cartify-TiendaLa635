/*
Campos:
    email: String,
    userName: String,
    password: String,
    isActive: Boolean,
*/

import{ Schema, model } from 'mongoose';

const adminSchema = new Schema({
    email: { type:"String"},
    userName: { type:"String"},
    password: { type:"String"},
    isActive: { type:"Boolean"}
},
{
    timestamps: true,
    strict: false
}
);

export default model('adminModel', adminSchema, "Admins");