/*
 Configuración EDITABLE del programa de puntos de fidelidad.

 Es un "singleton": normalmente existe un solo documento en la colección.
 Así el gerente puede cambiar desde el admin cuántos puntos se ganan y cuándo
 vencen, sin tocar el código (Mario lo pidió configurable, nada hardcodeado).

   pointsPerDollar:       puntos que gana el cliente por cada $1 gastado. (default 1)
   expiryMonths:          a los cuántos meses vencen los puntos.          (default 3)
   pointsPerDollarRedeem: cuántos puntos equivalen a $1 al CANJEAR.       (default 100)
   minRedeemPoints:       mínimo de puntos para poder canjear.            (default 100)
   isActive:              permite apagar el programa sin borrar la config.
*/

import { Schema, model } from 'mongoose';

const loyaltyConfigSchema = new Schema({
    pointsPerDollar: { type: Number, default: 1 },
    expiryMonths: { type: Number, default: 3 },
    pointsPerDollarRedeem: { type: Number, default: 100 },
    minRedeemPoints: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

export default model('loyaltyConfigModel', loyaltyConfigSchema, 'LoyaltyConfig');
