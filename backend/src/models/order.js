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

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b9c
 *         name:
 *           type: string
 *           example: Arroz Diana 500g
 *         price:
 *           type: number
 *           description: Precio unitario al momento de comprar.
 *           example: 3200
 *         amount:
 *           type: number
 *           example: 2
 *     PrintJob:
 *       type: object
 *       description: Solo presente cuando channel es "impresion".
 *       properties:
 *         serviceName:
 *           type: string
 *           example: Carta
 *         fileUrl:
 *           type: string
 *         public_id:
 *           type: string
 *         color:
 *           type: boolean
 *         copies:
 *           type: number
 *         pages:
 *           type: number
 *         doubleSided:
 *           type: boolean
 *         paper:
 *           type: string
 *         emailedToPrinter:
 *           type: boolean
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b80
 *         clientId:
 *           type: string
 *           description: ObjectId del cliente que compró (ref clientModel).
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         total:
 *           type: number
 *           example: 6400
 *         status:
 *           type: string
 *           enum: [pagado, preparando, entregado, cancelado]
 *           default: pagado
 *         paymentMethod:
 *           type: string
 *           default: efectivo
 *         paymentStatus:
 *           type: string
 *           enum: [pendiente, pagado]
 *           default: pagado
 *         pointsEarned:
 *           type: number
 *           example: 6
 *         channel:
 *           type: string
 *           enum: [web, kiosco, impresion]
 *           default: web
 *         printJob:
 *           $ref: '#/components/schemas/PrintJob'
 *       required:
 *         - clientId
 *         - items
 *         - total
 *     OrderCreateInput:
 *       type: object
 *       description: Payload JSON para el checkout. El total y los puntos se calculan en el backend.
 *       properties:
 *         clientId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         paymentMethod:
 *           type: string
 *           default: efectivo
 *         channel:
 *           type: string
 *           enum: [web, kiosco]
 *           default: web
 *       required:
 *         - clientId
 *         - items
 *     OrderStatusInput:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pagado, preparando, entregado, cancelado]
 *       required:
 *         - status
 *     PrintOrderInput:
 *       type: object
 *       description: Payload multipart/form-data para un pedido de impresión.
 *       properties:
 *         clientId:
 *           type: string
 *         serviceId:
 *           type: string
 *           description: ObjectId del PrintService a usar.
 *         color:
 *           type: boolean
 *         copies:
 *           type: number
 *           default: 1
 *         pages:
 *           type: number
 *           default: 1
 *         doubleSided:
 *           type: boolean
 *         paper:
 *           type: string
 *         file:
 *           type: string
 *           format: binary
 *       required:
 *         - clientId
 *         - serviceId
 *         - file
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
        enum: ['web', 'kiosco', 'impresion'],
        default: 'web',
    },
    // Datos del trabajo de impresión (solo cuando channel === 'impresion').
    printJob: {
        serviceName: { type: String },
        fileUrl: { type: String },
        public_id: { type: String },
        color: { type: Boolean, default: false },
        copies: { type: Number, default: 1 },
        pages: { type: Number, default: 1 },
        doubleSided: { type: Boolean, default: false },
        paper: { type: String },
        emailedToPrinter: { type: Boolean, default: false },
    },
}, {
    timestamps: true,
});

export default model('orderModel', orderSchema, 'Orders');
