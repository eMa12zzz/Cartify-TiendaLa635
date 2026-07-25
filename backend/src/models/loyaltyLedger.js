/*
 Ledger (libro mayor) de puntos de fidelidad — vencimiento por LOTES.

 Cada compra que otorga puntos crea un lote aquí, con su fecha de vencimiento.
 Los puntos "disponibles" del cliente = suma de los lotes cuyo venceEn aún no
 pasó. Así el vencimiento es real por compra, sin necesidad de tareas
 programadas: se calcula al momento de leer (vencimiento "lazy").

 Campos:
   clientId:  de quién son los puntos
   points:    cuántos puntos otorgó esta compra
   earnedAt:  cuándo se ganaron
   expiresAt: cuándo vencen (earnedAt + meses de la config)
   orderId:   el pedido que los generó
*/

import { Schema, model } from 'mongoose';

const loyaltyLedgerSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: 'clientModel', required: true },
    points: { type: Number, required: true },
    earnedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'orderModel' },
}, {
    timestamps: true,
});

export default model('loyaltyLedgerModel', loyaltyLedgerSchema, 'LoyaltyLedger');
