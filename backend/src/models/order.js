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
    subtotal: { type: Number },            // antes del descuento por puntos
    discount: { type: Number, default: 0 }, // descuento aplicado al canjear puntos
    pointsRedeemed: { type: Number, default: 0 },
    // Costo del envío cobrado en este pedido (0 si es retiro en el local). Se
    // saca de los ajustes de la tienda al momento de comprar, no del navegador.
    shippingCost: { type: Number, default: 0 },
    // Tarifa de servicio cobrada en este pedido (0 si la tienda no la tiene
    // activa). Como el envío, sale de los ajustes al comprar, no del navegador.
    serviceFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    /*
     * 'en_camino' solo aplica a domicilio: es cuando el repartidor ya salió
     * de la tienda con el pedido. Antes eso no era un estado — era nada más
     * un interruptor de "compartir ubicación" separado del estado del
     * pedido, así que era fácil que alguien empezara a repartir sin tocarlo
     * y el cliente se quedara viendo "Preparando" sin mapa toda la entrega.
     */
    status: {
        type: String,
        enum: ['pagado', 'preparando', 'en_camino', 'entregado', 'cancelado'],
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
     * EL CÓDIGO DE ENTREGA — cuatro dígitos que prueban quién recibe.
     *
     * Lo emite el servidor al crear el pedido y NUNCA lo manda el navegador:
     * si el cliente pudiera elegirlo, no probaría nada. Va en todos los
     * pedidos, sean de domicilio o de retiro en el local — el mostrador
     * también entrega a quien se presente. Ver utils/codigoEntrega.js.
     *
     * `select: false` es la mitad importante: sin eso el código viajaría en
     * CUALQUIER respuesta que devuelva pedidos, incluida la lista completa del
     * panel y el seguimiento del repartidor. Solo lo entrega a mano quien
     * comprobó que el pedido es de quien pregunta. Ver getOrdersByClient y
     * getOrderById en el controlador.
     */
    deliveryCode: { type: String, select: false },

    /*
     * Cuándo se comprobó el código contra el cliente en la puerta. Vacío en un
     * pedido ya entregado significa una cosa concreta: se entregó SIN
     * comprobar, porque el personal usó la salida de emergencia. Ver
     * deliveryCodeOmitido.
     */
    deliveryCodeVerifiedAt: { type: Date },

    /*
     * La salida de emergencia, y su rastro.
     *
     * El código no puede dejar a nadie sin su pedido: se queda sin batería, se
     * lo recibe la vecina, el correo no llegó. Si no hubiera forma de entregar
     * sin él, el personal terminaría marcando "entregado" desde la tienda
     * antes de salir —y entonces el código no valdría nada—.
     *
     * Así que se puede omitir, pero queda escrito quién lo omitió y por qué.
     * Un control que se puede saltar en silencio no es un control.
     */
    deliveryCodeOmitido: { type: Boolean, default: false },
    deliveryCodeMotivo: { type: String, maxlength: 200 },

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
    enCaminoAt: { type: Date },          // a qué hora salió el repartidor
    enCaminoBy: { type: String },
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
