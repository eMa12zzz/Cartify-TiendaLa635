/*
 * ============================================================
 * SESIÓN DE KIOSCO — kioskSession.js
 * ============================================================
 * El puente entre la pantalla del kiosco y el teléfono del cliente.
 *
 * El kiosco de la tienda no sabe quién está parado enfrente: cualquiera se
 * acerca y pide por voz. Esto resuelve eso sin pedirle a nadie que escriba su
 * correo y su contraseña en una pantalla pública (que además es lo peor que
 * se puede hacer con una contraseña).
 *
 * Cómo funciona:
 *   1. El kiosco crea una sesión y muestra su código como QR.
 *   2. El cliente lo escanea con SU teléfono, donde ya tiene sesión iniciada.
 *   3. El teléfono confirma y la sesión queda con su clientId.
 *   4. El kiosco cobra y el pedido sale a nombre de esa persona, con sus
 *      puntos incluidos.
 *
 * La contraseña nunca pasa por el kiosco. Lo único que viaja es un código de
 * seis caracteres que muere en diez minutos.
 * ============================================================
 */
import { Schema, model } from 'mongoose';

const kioskSessionSchema = new Schema({
    // Lo que se dibuja en el QR. Corto a propósito: si la cámara falla, se
    // puede teclear.
    codigo: { type: String, required: true, unique: true, index: true },

    // Quién la reclamó. Vacío mientras nadie la escanea.
    clientId: { type: Schema.Types.ObjectId, ref: 'clientModel' },

    /*
     * esperando → nadie la ha escaneado todavía
     * vinculada → un cliente la reclamó; el kiosco ya sabe de quién es
     * usada    → ya se cobró un pedido con ella; no sirve dos veces
     */
    estado: {
        type: String,
        enum: ['esperando', 'vinculada', 'usada'],
        default: 'esperando',
    },

    /*
     * Muere sola a los diez minutos.
     *
     * El índice TTL de Mongo borra el documento cuando pasa esta fecha, así
     * que no queda un basurero de códigos viejos ni hace falta una tarea de
     * limpieza. Diez minutos es más que suficiente para una compra y poco
     * para que alguien reutilice un QR que quedó en la pantalla.
     */
    expiraEn: { type: Date, required: true, index: { expires: 0 } },
}, {
    timestamps: true,
});

export default model('kioskSessionModel', kioskSessionSchema, 'KioskSessions');
