/*
 Pedido / Venta de un CLIENTE.

 OJO: esto es distinto de "shoppings", que son las COMPRAS a proveedores
 (reabastecer inventario). Aquí modelamos la venta de salida: lo que un
 cliente compra en la tienda. De este modelo dependen "Mis Pedidos", la
 pantalla del empleado y los puntos de fidelidad.

 Campos:
   clientId:      quién compró
   items:         [{ productId, name, price, amount }] — foto del producto al comprar
   total:         Number (se calcula en el backend, no se confía en el front)
   status:        estado de preparación/entrega
   paymentMethod: método de pago usado
   paymentStatus: si ya está pagado
   pointsEarned:  puntos de fidelidad generados por esta compra
   channel:       'web' | 'kiosco'  (el kiosco será el Asistente de Voz futuro)
*/

import { Schema, model } from 'mongoose';

// Cada línea del pedido. Guardamos name y price como "foto" del momento de la
// compra: si el producto cambia de precio o nombre después, el pedido histórico
// no se altera.
const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'productModel' },
    name: { type: String },
    price: { type: Number },   // precio unitario al momento de comprar
    amount: { type: Number },  // cantidad
}, { _id: false });

const orderSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, ref: 'clientModel', required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pagado', 'preparando', 'entregado', 'cancelado'],
        default: 'pagado',
    },
    paymentMethod: { type: String, default: 'efectivo' },
    paymentStatus: {
        type: String,
        enum: ['pendiente', 'pagado'],
        default: 'pagado',
    },
    pointsEarned: { type: Number, default: 0 },
    channel: {
        type: String,
        enum: ['web', 'kiosco'],
        default: 'web',
    },
}, {
    timestamps: true,
});

export default model('orderModel', orderSchema, 'Orders');
