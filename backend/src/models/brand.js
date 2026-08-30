/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b50
 *         name:
 *           type: string
 *           example: Diana
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - name
 *     BrandInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Diana
 *         isActive:
 *           type: boolean
 *       required:
 *         - name
 */

import { Schema, model } from 'mongoose';

const brandSchema = new Schema({

    name: {
        type: String,
        required: true
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

export default model('brandsModel', brandSchema, 'Brands');