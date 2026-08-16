/*
Campos:
    name: String,
    description: String,
    isActive: Boolean,
    flujo: String,
    icono: String,
    orden: Number,
 */

    /**
     * @swagger
     * components:
     *   schemas:
     *     Module:
     *       type: object
     *       properties:
     *         _id:
     *           type: string
     *           example: 68932f1a2b3c4d5e6f7a8bb0
     *         name:
     *           type: string
     *           example: Pasillo 3 - Abarrotes
     *         description:
     *           type: string
     *           example: Módulo de granos, enlatados y abarrotes secos.
     *         isActive:
     *           type: boolean
     *           default: true
     *       required:
     *         - name
     *     ModuleInput:
     *       type: object
     *       properties:
     *         name:
     *           type: string
     *         description:
     *           type: string
     *         isActive:
     *           type: boolean
     *       required:
     *         - name
     *         - description
     */

    import{ Schema, model } from 'mongoose';

    const moduleSchema = new Schema({
        name: { type:"String"},
        description: { type:"String"},
        isActive: { type:"Boolean"},
        /*
         * Cómo se COMPRA lo de este módulo. Es el único dato que de verdad
         * separa un módulo de otro:
         *
         *   'estandar'    → se agrega al carrito como cualquier producto.
         *                   Panadería, pupusería, librería: todas caen aquí y
         *                   no necesitan una sola línea de código nueva.
         *   'impresiones' → hay que preguntar cosas antes de comprar (archivo,
         *                   tamaño, color, páginas), así que tiene pantalla
         *                   propia.
         *
         * Antes esto se adivinaba comparando el NOMBRE del módulo con "tienda"
         * o "impresiones". Al crear "Panadería" las reglas cambiaban solas —el
         * proveedor dejaba de ser obligatorio— sin que nadie lo hubiera
         * decidido.
         */
        flujo: { type: String, enum: ['estandar', 'impresiones'], default: 'estandar' },
        // Cara del módulo en la pantalla de servicios del cliente.
        icono: { type: String, default: '' },
        orden: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        strict: false
    }
    );

    export default model('moduleModel', moduleSchema, "Modules");
