/*
Campos:
    fullName: String,
    dui: String,
    phoneNumber: String,
    ClientAddress: Array,
    image: String,
    email: String,
    userName: String,
    password: String,
    lolayitypoints: String,
    favorites: objectId,
    isVerified: Boolean,
    isActive: Boolean,
*/

import{ Schema, model } from 'mongoose';

const clientSchema = new Schema({
    fullName: { type:"String"},
    dui: { type:"String"},
    phoneNumber: { type:"String"},
    clientAddress: { type:["String"]},
    image: { type:"String"},
    public_id: { type:"String"},
    email: { type:"String"},
    userName: { type:"String"},
    password: { type:"String"},
    // Campo viejo (con typo y tipo String). Se mantiene por compatibilidad con
    // los datos que ya existen en la base; la lógica nueva NO lo usa.
    lolayitypoints: { type:"String", default: 0},
    // Puntos de fidelidad reales (Number). Este es el que usa toda la lógica
    // nueva de loyalty: se suma al crear un pedido y se muestra en el admin.
    loyaltyPoints: { type: Number, default: 0 },
    favorites: { type: Schema.Types.ObjectId, ref: "productModel"},
    isVerified: { type:"Boolean", default: false},
    isActive: { type:"Boolean", default: true}
},
{
    timestamps: true,
    strict: false
}
);

export default model('clientModel', clientSchema, "Clients");   