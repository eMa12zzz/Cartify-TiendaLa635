/*
Campos:
    fullName: String,
    dui: String,          // OPCIONAL
    phoneNumber: String,
    clientAddress: Array, // direcciones de entrega
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
    /*
     * DUI opcional, y a propósito SIN `unique`.
     *
     * Mucha gente del barrio no lo anda a mano y no vale la pena perder el
     * registro por eso. Si algún día se quiere impedir DUI repetidos, el
     * índice tiene que ser `unique` + `sparse`: sin sparse, el segundo cliente
     * que se registre sin DUI choca contra el primero por duplicado. Por eso
     * los controladores guardan undefined y nunca cadena vacía.
     */
    dui: { type:"String"},
    phoneNumber: { type:"String"},
    /*
     * Direcciones de entrega: { nombre, direccion, referencia, lat, lng }.
     *
     * Va como Mixed y no como subesquema porque los clientes que ya existen
     * las tienen guardadas como texto suelto. Con un esquema estricto,
     * Mongoose intentaría convertir esas cadenas en objetos al leerlas y la
     * pantalla de direcciones se caería para todos ellos. El frontend
     * normaliza las dos formas.
     */
    clientAddress: { type: [Schema.Types.Mixed], default: [] },
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
    /*
     * Saldo digital en dólares, cargado canjeando gift cards.
     * Solo lo mueve el servidor: al canjear una tarjeta sube, al pagar con
     * saldo baja. Nunca se toca con un valor que venga del navegador.
     */
    balance: { type: Number, default: 0, min: 0 },
    // Preferencias de notificación del cliente (área "Mi Cuenta").
    notificationPrefs: {
      promociones:     { type: Boolean, default: true },
      nuevosProductos: { type: Boolean, default: true },
      pedidoCerca:     { type: Boolean, default: false },
    },
    // Métodos de pago guardados. SOLO datos NO sensibles: tipo, alias y los
    // últimos 4 dígitos. NUNCA el número completo ni el CVV — el cobro real
    // pasa por la pasarela de pago (Wompi).
    paymentMethods: [
      {
        type:  { type: String, default: 'tarjeta' },
        alias: { type: String },
        last4: { type: String },
      },
    ],
    /*
     * Los productos que el cliente marcó con el corazón.
     *
     * Era UN solo ObjectId: cabía un favorito por persona, así que el segundo
     * corazón habría borrado el primero. Ahora es una lista.
     */
    favorites: [{ type: Schema.Types.ObjectId, ref: "productModel" }],
    isVerified: { type:"Boolean", default: false},
    isActive: { type:"Boolean", default: true}
},
{
    timestamps: true,
    strict: false
}
);

export default model('clientModel', clientSchema, "Clients");   