import mongoose, { Schema, model } from 'mongoose';

const productTypeSchema = new Schema({
    
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "moduleModel", 
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

    // Array de proveedores que surten esta categoría — permite filtrado en cascada en el formulario de productos
    supplierIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "supplierModel",
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