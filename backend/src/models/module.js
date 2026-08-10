/*
Campos:
    name: String,
    description: String,
    isActive: Boolean,
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
        isActive: { type:"Boolean"}
    },
    {
        timestamps: true,
        strict: false
    }
    );
    
    export default model('moduleModel', moduleSchema, "Modules");