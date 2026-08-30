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

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b20
 *         fullName:
 *           type: string
 *           example: Juan Pérez
 *         dui:
 *           type: string
 *           example: "04512345-6"
 *         phoneNumber:
 *           type: string
 *           example: "70112233"
 *         clientAddress:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Col. Escalón, San Salvador"]
 *         image:
 *           type: string
 *           example: https://res.cloudinary.com/demo/image/upload/v1/clients/juan.png
 *         email:
 *           type: string
 *           format: email
 *           example: juan.perez@example.com
 *         userName:
 *           type: string
 *           example: juanp
 *         password:
 *           type: string
 *           format: password
 *           description: Hash bcrypt. Nunca se expone en las respuestas.
 *         loyaltyPoints:
 *           type: number
 *           example: 120
 *         notificationPrefs:
 *           type: object
 *           properties:
 *             promociones:
 *               type: boolean
 *               default: true
 *             nuevosProductos:
 *               type: boolean
 *               default: true
 *             pedidoCerca:
 *               type: boolean
 *               default: false
 *         paymentMethods:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: tarjeta
 *               alias:
 *                 type: string
 *                 example: Visa personal
 *               last4:
 *                 type: string
 *                 example: "4242"
 *         favorites:
 *           type: string
 *           description: ObjectId del producto favorito (ref productModel).
 *         isVerified:
 *           type: boolean
 *           default: false
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - fullName
 *         - email
 *         - userName
 *         - password
 *     ClientLoginInput:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: juan.perez@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: MiClave123
 *       required:
 *         - email
 *         - password
 *     ClientRegisterInput:
 *       type: object
 *       description: Payload multipart/form-data para iniciar el registro de un cliente. No se guarda en la base de datos hasta verificar el código enviado por correo.
 *       properties:
 *         fullName:
 *           type: string
 *         dui:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         ClientAddress:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         userName:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *         image:
 *           type: string
 *           format: binary
 *       required:
 *         - fullName
 *         - email
 *         - userName
 *         - password
 *     VerifyEmailCodeInput:
 *       type: object
 *       properties:
 *         verificationCodeRequest:
 *           type: string
 *           description: Código de 6 caracteres enviado al correo del cliente.
 *           example: a1b2c3
 *       required:
 *         - verificationCodeRequest
 *     RecoveryRequestCodeInput:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: juan.perez@example.com
 *       required:
 *         - email
 *     RecoveryVerifyCodeInput:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: a1b2c3
 *       required:
 *         - code
 *     RecoveryNewPasswordInput:
 *       type: object
 *       properties:
 *         newPassword:
 *           type: string
 *           format: password
 *           example: NuevaClave123
 *         confirmNewPassword:
 *           type: string
 *           format: password
 *           example: NuevaClave123
 *       required:
 *         - newPassword
 *         - confirmNewPassword
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientUpdateInput:
 *       type: object
 *       description: Payload multipart/form-data usado por el admin para editar un cliente (PUT /client/{id}).
 *       properties:
 *         fullName:
 *           type: string
 *         dui:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         ClientAddress:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         userName:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *           description: Opcional. Si se envía, se re-hashea; si se omite, se conserva la actual.
 *         image:
 *           type: string
 *           format: binary
 *       required:
 *         - fullName
 *         - dui
 *         - phoneNumber
 *         - ClientAddress
 *         - email
 *         - userName
 *     ClientProfileUpdateInput:
 *       type: object
 *       description: JSON parcial. El cliente edita su propio perfil (PATCH /client/{id}/profile); solo se actualizan los campos enviados.
 *       properties:
 *         fullName:
 *           type: string
 *         userName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phoneNumber:
 *           type: string
 *     ClientAddressesInput:
 *       type: object
 *       properties:
 *         addresses:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Col. Escalón, San Salvador", "Av. Los Próceres #123"]
 *       required:
 *         - addresses
 *     ClientNotificationsInput:
 *       type: object
 *       properties:
 *         promociones:
 *           type: boolean
 *         nuevosProductos:
 *           type: boolean
 *         pedidoCerca:
 *           type: boolean
 *     ClientPaymentMethodsInput:
 *       type: object
 *       description: Solo se guardan datos no sensibles (tipo, alias y últimos 4 dígitos).
 *       properties:
 *         paymentMethods:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: tarjeta
 *               alias:
 *                 type: string
 *                 example: Visa personal
 *               last4:
 *                 type: string
 *                 example: "4242"
 *       required:
 *         - paymentMethods
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
    /*
     * Fecha de nacimiento (opcional). Con ella se calcula la edad para destapar
     * los productos +18 en la tienda. Es una barrera blanda —se puede mentir—,
     * así que la verificación de verdad sigue siendo el DUI físico en la entrega.
     */
    fechaNacimiento: { type: Date },
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
    /*
     * Inicio de sesión con Google. `googleId` es el "sub" (identificador
     * estable) que devuelve Google; con él se reconoce a quien vuelve a entrar
     * aunque cambie el correo. `authProvider` distingue 'local' (correo y
     * contraseña) de 'google' — quien entró por Google no tiene contraseña, así
     * que el login normal no debe pedírsela.
     */
    googleId: { type:"String"},
    authProvider: { type:"String", default: "local"},
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
    /*
     * Ojo con `promociones`: el default es true por los clientes que ya
     * existían antes de que hubiera dónde elegir. Los que se registran DESDE
     * el consentimiento traen el valor explícito de su casilla —que llega
     * desmarcada—, así que ese default ya no los toca. Ver `consentimiento`.
     */
    notificationPrefs: {
      promociones:     { type: Boolean, default: true },
      nuevosProductos: { type: Boolean, default: true },
      pedidoCerca:     { type: Boolean, default: false },
    },
    /*
     * El consentimiento, tal como se dio: qué versión de los términos aceptó y
     * cuándo.
     *
     * Guardar solo "aceptó: sí" no sirve de nada. El día que cambie el texto,
     * sin la versión no hay forma de saber a quién hay que volver a
     * preguntarle, y sin la fecha no hay forma de demostrar que aceptó — que es
     * justo lo que le van a pedir a la tienda si alguien reclama.
     *
     * `promociones` se guarda aparte de notificationPrefs a propósito: aquello
     * es una preferencia que la persona cambia diez veces desde su cuenta, y
     * esto es el registro de lo que eligió al entrar. Uno se sobreescribe, el
     * otro es historia.
     */
    consentimiento: {
      terminosVersion:  { type: String },
      aceptadoEn:       { type: Date },
      promociones:      { type: Boolean, default: false },
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