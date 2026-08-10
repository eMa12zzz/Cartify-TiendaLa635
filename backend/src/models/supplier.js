/*
Campos:
    name: String,
    phoneNumber: String,
    email: String,
    creditDays: String,
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8b40
 *         name:
 *           type: string
 *           example: Distribuidora Central S.A.
 *         phoneNumber:
 *           type: string
 *           example: "22334455"
 *         email:
 *           type: string
 *           format: email
 *           example: contacto@distribuidoracentral.com
 *         creditDays:
 *           type: string
 *           example: "30"
 *         brandIds:
 *           type: array
 *           items:
 *             type: string
 *           description: ObjectIds de las marcas asociadas a este proveedor.
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - name
 *         - email
 *     SupplierInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Distribuidora Central S.A.
 *         phoneNumber:
 *           type: string
 *           example: "22334455"
 *         email:
 *           type: string
 *           format: email
 *           example: contacto@distribuidoracentral.com
 *         creditDays:
 *           type: string
 *           example: "30"
 *         brandIds:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *       required:
 *         - name
 *         - phoneNumber
 *         - email
 *         - creditDays
 */

import{ Schema, model } from 'mongoose';

const supplierSchema = new Schema({
    name: { type:"String"},
    phoneNumber: { type:"String"},
    email: { type:"String"},
    creditDays: { type:"String"}
},
{
    timestamps: true,
    strict: false
}
);

export default model('supplierModel', supplierSchema, "Suppliers");