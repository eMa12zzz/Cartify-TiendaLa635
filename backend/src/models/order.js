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
    subtotal: { type: Number },            // antes del descuento por puntos
    discount: { type: Number, default: 0 }, // descuento aplicado al canjear puntos
    pointsRedeemed: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pagado', 'preparando', 'entregado', 'cancelado'],
        default: 'pagado',
    },
    /*
     * Cómo paga. 'saldo' descuenta del balance digital del cliente (cargado
     * con gift cards); los demás se cobran en el local o al entregar, porque
     * todavía no hay pasarela de pago conectada.
     */
    paymentMethod: {
        type: String,
        enum: ['efectivo', 'tarjeta', 'saldo'],
        default: 'efectivo',
    },
    /*
     * Si se lo llevan a la casa o lo pasa a traer.
     * Con 'delivery' el pedido necesita dirección; con 'retiro' no.
     */
    deliveryType: {
        type: String,
        enum: ['delivery', 'retiro'],
        default: 'retiro',
    },
    deliveryAddress: { type: String },   // texto de la dirección elegida
    deliveryReference: { type: String }, // "portón verde, frente a la cancha"
    deliveryLat: { type: Number },       // punto marcado en el mapa
    deliveryLng: { type: Number },

    /*
     * Cuándo pasó cada cosa y quién la hizo.
     *
     * Antes solo existía `status` y el `updatedAt` de los timestamps, que se
     * pisa con cualquier cambio: no quedaba constancia de a qué hora se
     * preparó un pedido ni de quién lo entregó. Sin esto no se puede decir
     * "este pedido tardó 40 minutos" ni reclamarle nada a nadie.
     */
    preparedAt: { type: Date },
    preparedBy: { type: String },        // nombre de quien lo preparó
    deliveredAt: { type: Date },
    deliveredBy: { type: String },

    /*
     * Valoración del SERVICIO de entrega (no del producto).
     *
     * La deja el cliente cuando su pedido a DOMICILIO ya fue entregado: qué tal
     * llegó, a tiempo, el trato del repartidor. Va embebida porque es 1:1 con el
     * pedido —una entrega, una valoración— y así no hace falta otra colección.
     */
    serviceRating: {
        rating:  { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500, default: '' },
        ratedAt: { type: Date },
    },

    /*
     * Dónde va el repartidor, en vivo.
     *
     * Solo se llena mientras alguien está llevando ESTE pedido, y se borra al
     * entregarlo o cancelarlo. No es un historial: no queremos guardar por
     * dónde anduvo un empleado después de que terminó su trabajo, y el cliente
     * tampoco tiene por qué verlo una vez recibió su compra.
     *
     * `updatedAt` es lo que permite ser honestos: si el último punto tiene
     * tres minutos, se le dice al cliente que la señal se enfrió en vez de
     * dejarle un puntito quieto haciéndose el vivo.
     */
    courier: {
        active: { type: Boolean, default: false },
        lat: { type: Number },
        lng: { type: Number },
        name: { type: String },          // quién va manejando
        updatedAt: { type: Date },       // cuándo mandó su última posición
    },
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
