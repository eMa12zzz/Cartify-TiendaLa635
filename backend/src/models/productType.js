/**
 * @swagger
 * components:
 *   schemas:
 *     ProductType:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b60
 *         moduleId:
 *           type: string
 *           description: ObjectId del módulo/estante al que pertenece.
 *           example: 68932f1a2b3c4d5e6f7a8b03
 *         type:
 *           type: string
 *           example: Granos
 *         subtype:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Arroz", "Frijol"]
 *         supplierIds:
 *           type: array
 *           items:
 *             type: string
 *           description: "ObjectIds de proveedores asociados. No está definido en el schema estricto de Mongoose, pero se guarda porque el modelo usa strict false."
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - moduleId
 *         - type
 *     ProductTypeInput:
 *       type: object
 *       properties:
 *         moduleId:
 *           type: string
 *         type:
 *           type: string
 *         subtype:
 *           type: array
 *           items:
 *             type: string
 *         supplierIds:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *       required:
 *         - moduleId
 *         - type
 *         - subtype
 */

import mongoose, { Schema, model } from 'mongoose';

const productTypeSchema = new Schema({
    
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module", 
        required: true,
      
    },
    type: {
        type: String,
        required: true
    },

    subtype: {
        type: [String],
        default: []
    },

    isActive: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true,
    strict: false
});

export default model('productTypeModel', productTypeSchema, 'ProductTypes');