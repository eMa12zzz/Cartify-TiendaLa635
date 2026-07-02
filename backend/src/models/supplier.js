/*
Campos:
    name: String,
    phoneNumber: String,
    email: String,
    creditDays: String,
 */

import{ Schema, model } from 'mongoose';

const supplierSchema = new Schema({
    name: { type:"String"},
    phoneNumber: { type:"String"},
    email: { type:"String"},
    creditDays: { type:"String"}
},
{
    timestamps: true,
    strict: false
}
);

export default model('supplierModel', supplierSchema, "Suppliers");